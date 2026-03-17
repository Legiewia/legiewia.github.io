Office.initialize = function (reason) { };

function set_body(signatureDetails, eventObj) {

    if (is_valid_data(signatureDetails.logoBase64) === true) {
        //If a base64 image was passed we need to attach it.
        Office.context.mailbox.item.addFileAttachmentFromBase64Async(
            signatureDetails.logoBase64,
            signatureDetails.logoFileName,
            {
                isInline: true,
            },
            function (result) {
                Office.context.mailbox.item.body.setAsync(
                    "<br/><br/>" + signatureDetails.signature,
                    {
                        coercionType: "html",
                        asyncContext: eventObj,
                    },
                    function (asyncResult) {

                        asyncResult.asyncContext.completed();
                    }
                );
            });
    } else {
        Office.context.mailbox.item.body.setAsync(
            "<br/><br/>" + signatureDetails.signature,
            {
                coercionType: "html",
                asyncContext: eventObj,
            },
            function (asyncResult) {

                asyncResult.asyncContext.completed();
            }
        );
    }
}

function insert_auto_signature(eventObj) {
    let user_mail = Office.context.mailbox.userProfile.emailAddress;

    fetch("signatures.json")
        .then(response => response.json())
        .then(signatures => {
            let user_signature = signatures.find(s => s.email === user_mail);

            if (user_signature && is_valid_data(user_signature.signature)) {

                // 1️⃣ get username from email
                let username = user_signature.email.split("@")[0];

                // 2️⃣ build image path
                let imagePath = `assets/signatures/${username}.png`;

                // 3️⃣ fetch image and convert to base64
                fetch(imagePath)
                    .then(res => res.blob())
                    .then(blob => {

                        let reader = new FileReader();

                        reader.onloadend = function () {

                            let dataUrl = reader.result;

                            // 4️⃣ extract only the base64 string for addFileAttachmentFromBase64Async
                            let base64Image = dataUrl.split(',')[1];
                            let logoFileName = `${username}.png`;

                            // 5️⃣ build signature HTML (using cid reference instead of direct inline base64)
                            let html = `
                            <div style="text-align: left; text-indent: 0px; background-color: rgb(255, 255, 255); margin: 0px; font-family: &quot;MS PGothic&quot;, &quot;ＭＳ Ｐゴシック&quot;, &quot;MS Gothic&quot;, &quot;ＭＳ ゴシック&quot;, &quot;Hiragino Kaku Gothic ProN&quot;, sans-serif; font-size: 10pt; color: rgb(0, 0, 0);">
                                <a href="https://linktr.ee/coopenorte" title="https://linktr.ee/coopenorte" style="text-decoration: none;">
                                    <img src="cid:${logoFileName}" width="600" height="227" style="width: 600px; height: 227px; max-width: 781px;"/>
                                </a>
                                <br>
                                <i style="color:#999">
                                Este correo electrónico es confidencial.
                                </i>
                            </div>
                            `;

                            user_signature.signature = html;
                            user_signature.logoBase64 = base64Image;
                            user_signature.logoFileName = logoFileName;

                            // 6️⃣ insert signature
                            set_body(user_signature, eventObj);

                        };

                        reader.readAsDataURL(blob);

                    })
                    .catch(err => {
                        console.error("Image load error:", err);
                        eventObj.completed();
                    });

            } else {
                display_insight_infobar();
                eventObj.completed();
            }
        })
        .catch(error => {
            console.error("Error:", error);
            display_insight_infobar();
            eventObj.completed();
        });
}