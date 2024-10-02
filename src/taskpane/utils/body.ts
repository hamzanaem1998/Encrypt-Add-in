export function getBody(cb: (data: string) => void) {
    Office.context.mailbox.item.body.getAsync(Office.CoercionType.Text, function (result) {
      cb(result.value);
    });
  }
  
  export function setBody(data: string, cb: () => void) {
    Office.context.mailbox.item.body.setAsync(data, { coercionType: Office.CoercionType.Text }, function () {
      cb();
    });
  }
  