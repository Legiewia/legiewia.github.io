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
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(signatures => {
            let user_signature = signatures.find(s => s.email === user_mail);

            if (user_signature && is_valid_data(user_signature.signature)) {
                Office.context.mailbox.item.body.setSignatureAsync(
                    user_signature.signature,
                    {
                        coercionType: "html",
                        asyncContext: eventObj,
                    },
                    function (asyncResult) {
                        asyncResult.asyncContext.completed();
                    }
                );
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

Office.actions.associate("checkSignature", checkSignature);