const forge = require("node-forge");

export function sign(data: string, pem: string) {
  var md = forge.md.sha256.create();
  md.update(data, "utf8");
  var pss = forge.pss.create({
    md: forge.md.sha256.create(),
    mgf: forge.mgf.mgf1.create(forge.md.sha256.create()),
    saltLength: 20,
    // optionally pass 'prng' with a custom PRNG implementation
    // optionalls pass 'salt' with a forge.util.ByteBuffer w/custom salt
  });
  var privateKey = forge.pki.privateKeyFromPem(pem);
  var signature = privateKey.sign(md, pss);
  var encoded = forge.util.encode64(signature);
  return encoded;
}

export function Verif(data: string, pem: string, signature: string) {
  var str = forge.util.decode64(signature);
  var pss = forge.pss.create({
    md: forge.md.sha256.create(),
    mgf: forge.mgf.mgf1.create(forge.md.sha256.create()),
    saltLength: 20,
    // optionally pass 'prng' with a custom PRNG implementation
  });
  var md = forge.md.sha256.create();
  md.update(data, "utf8");
  var cert = forge.pki.certificateFromPem(pem);
  var bol = cert.publicKey.verify(md.digest().getBytes(), str, pss);
  return bol;
}
