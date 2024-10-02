//import { getcert } from "./getverifCert";
var getcert = require("./getverifCert").getcert;
export async function getcertemail(item) {
  var email = "";
  item.to.getAsync(function (asyncResult) {
    if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
      const msgTo = asyncResult.value;
      email = msgTo[0].emailAddress;
      //to use when multiple receivers
      /*for (let i = 0; i < msgTo.length; i++) {
          email[i] = msgTo[i].emailAddress;
        }*/
    } else {
      console.error(asyncResult.error);
    }
  });
  const pub_key = await getcert(email);
  return pub_key;
}
