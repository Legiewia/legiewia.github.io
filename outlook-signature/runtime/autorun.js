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
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(signatures => {
            let user_signature = signatures.find(s => s.email === user_mail);

            if (user_signature && is_valid_data(user_signature.signature)) {
                set_body(user_signature, eventObj);
            } else {
                display_insight_infobar();
                eventObj.completed();
            }
        })
        .catch(error => {
            console.error("Error checking signature:", error);
            display_insight_infobar();
            eventObj.completed();
        });
}