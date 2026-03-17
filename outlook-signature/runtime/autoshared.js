function is_valid_data(data) {
    return data !== null && data !== undefined && data !== "";
}

function get_command_id() {
    if (Office.context.mailbox.item.itemType == "appointment") {
        return "MRCS_TpBtn1";
    }
    return "MRCS_TpBtn0";
}

function display_insight_infobar() {
    Office.context.mailbox.item.notificationMessages.addAsync("fd90eb33431b46f58a68720c36154b4a", {
        type: "insightMessage",
        message: "No encontramos tu firma, contacta a tu administrador.",
        icon: "Icon.16x16",
        actions: [
            {
                actionType: "showTaskPane",
                actionText: "Set signatures",
                commandId: get_command_id(),
                contextData: "{''}",
            },
        ],
    });
}

function checkSignature(eventObj) {

    let user_mail = Office.context.mailbox.userProfile.emailAddress;

    fetch("signatures.json")
        .then(response => response.json())
        .then(signatures => {

            let user_signature = signatures.find(s => s.email === user_mail);

            if (user_signature && is_valid_data(user_signature.signature)) {

                // 1️⃣ get username from email
                let username = user_signature.email.split("@")[0];

                // 2️⃣ build image path
                let imagePath = `../assets/signatures/${username}.png`;

                // 3️⃣ fetch image and convert to base64
                fetch(imagePath)
                    .then(res => res.blob())
                    .then(blob => {

                        let reader = new FileReader();

                        reader.onloadend = function () {

                            let base64Image = reader.result; // already includes data:image/png;base64,...

                            // 4️⃣ build signature HTML
                            let html = `
                            <div style="text-align: left; text-indent: 0px; background-color: rgb(255, 255, 255); margin: 0px; font-family: &quot;MS PGothic&quot;, &quot;ＭＳ Ｐゴシック&quot;, &quot;MS Gothic&quot;, &quot;ＭＳ ゴシック&quot;, &quot;Hiragino Kaku Gothic ProN&quot;, sans-serif; font-size: 10pt; color: rgb(0, 0, 0);">
                                <a href="https://linktr.ee/coopenorte" title="https://linktr.ee/coopenorte" style="text-decoration: none;">
                                    <img src="${base64Image}" width="600" height="227" style="width: 600px; height: 227px; max-width: 781px;"/>
                                </a>
                                <br>
                                <br>
                                <i style="color:#999">
                                Este correo electrónico y los archivos adjuntos son confidenciales y están dirigidos exclusivamente a su destinatario. Si usted no es el destinatario indicado, se le notifica que la lectura, uso, divulgación y/o copia sin autorización está estrictamente prohibida. En tal caso, por favor elimine este mensaje y notifíquelo inmediatamente al remitente.
                                </i>
                            </div>
                            `;

                            // 5️⃣ insert signature
                            Office.context.mailbox.item.body.setSignatureAsync(
                                html,
                                { coercionType: Office.CoercionType.Html },
                                function () {
                                    eventObj.completed();
                                }
                            );

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

Office.actions.associate("checkSignature", checkSignature);