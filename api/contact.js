const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_TO = process.env.EMAIL_TO;

// ── Rate limiting (in-memory, resets per cold start) ──
const rateLimit = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = 3;
  if (!rateLimit.has(ip)) rateLimit.set(ip, []);
  const timestamps = rateLimit.get(ip).filter(t => now - t < windowMs);
  rateLimit.set(ip, timestamps);
  if (timestamps.length >= maxRequests) return false;
  timestamps.push(now);
  return true;
}

// ── Sanitize HTML ──
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
    .trim().substring(0, 1000);
}

// ── XSS detection ──
function hasXSS(str) {
  return /<script|javascript:|on\w+\s*=|<iframe|<object|<embed|<form|<svg\s+on|eval\s*\(|document\.|window\.|\.cookie|\.innerHTML|alert\s*\(/i.test(str);
}

// ── Disposable email domains blocklist ──
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com','10minmail.com','33mail.com','abyssmail.com','anonaddy.com','binkmail.com',
  'bobmail.info','brefmail.com','bugmenot.com','burnermail.io','byom.de','clipmail.eu',
  'crazymailing.com','deadaddress.com','despammed.com','devnullmail.com','discard.email',
  'discardmail.com','discardmail.de','disposable-email.ml','disposableemailaddresses.emailmiser.com',
  'disposableinbox.com','dispose.it','dm.w3internet.co.uk','dodgeit.com','dodgit.com',
  'dontreg.com','drdrb.com','e4ward.com','emailigo.de','emailisvalid.com','emailondeck.com',
  'emailproxsy.com','emailsensei.com','emailtemporanea.com','emailtemporanea.net',
  'emailtemporar.ro','emailtemporario.com.br','emailthe.net','emailtmp.com','emailwarden.com',
  'emailx.at.hm','emailz.ml','emz.net','fakeinbox.com','fakemailgenerator.com',
  'fastacura.com','filzmail.com','fixmail.tk','flyspam.com','garliclife.com','get2mail.fr',
  'getairmail.com','getnada.com','getonemail.com','gishpuppy.com','goemailgo.com',
  'grr.la','guerrillamail.biz','guerrillamail.com','guerrillamail.de','guerrillamail.info',
  'guerrillamail.net','guerrillamail.org','guerrillamailblock.com','harakirimail.com',
  'hidemail.de','hidzz.com','hotpop.com','iminbox.com','imstations.com','inboxalias.com',
  'inboxbear.com','inboxclean.com','inboxclean.org','incognitomail.com','incognitomail.net',
  'incognitomail.org','instantemailaddress.com','jetable.com','jetable.fr.nf','jetable.net',
  'jetable.org','jnxjn.com','kasmail.com','koszmail.pl','kurzepost.de','letthemeatspam.com',
  'lhsdv.com','lifebyfood.com','link2mail.net','litedrop.com','lol.ovpn.to','lookugly.com',
  'lopl.co.cc','lortemail.dk','lr78.com','lroid.com','lukop.dk','m21.cc','mail-temporaire.fr',
  'mail.by','mail.mezimages.net','mail2rss.org','mail333.com','mailbidon.com','mailblocks.com',
  'mailbucket.org','mailcat.biz','mailcatch.com','maildrop.cc','maildrop.cf','maildrop.ga',
  'maildrop.gq','maildrop.ml','maildu.de','maileater.com','mailexpire.com','mailfa.tk',
  'mailforspam.com','mailfree.ga','mailfree.gq','mailfree.ml','mailguard.me','mailhazard.com',
  'mailhazard.us','mailhz.me','mailimate.com','mailin8r.com','mailinater.com','mailinator.com',
  'mailinator.net','mailinator.org','mailinator2.com','mailincubator.com','mailismagic.com',
  'mailmate.com','mailmoat.com','mailnator.com','mailnesia.com','mailnull.com','mailorg.org',
  'mailpick.biz','mailproxsy.com','mailquack.com','mailrock.biz','mailscrap.com','mailshell.com',
  'mailsiphon.com','mailslapping.com','mailslite.com','mailtemp.info','mailtemporal.com',
  'mailtemporaire.com','mailtemporaire.fr','mailtemporary.com','mailthunder.com','mailtothis.com',
  'mailtrash.net','mailtv.net','mailtv.tv','mailzilla.com','mailzilla.org','makemetheking.com',
  'manifestgenerator.com','mbx.cc','mega.zik.dj','meinspamschutz.de','meltmail.com',
  'messagebeamer.de','mezimages.net','mintemail.com','mjukgansen.com','moakt.com',
  'mobi.web.id','mobileninja.co.uk','mohmal.com','moncourrier.fr.nf','monemail.fr.nf',
  'monmail.fr.nf','mt2015.com','mx0.wwwnew.eu','mymail-in.net','mypacks.net','mypartyclip.de',
  'myphantom.com','mysamp.de','mytemp.email','mytempemail.com','mytempmail.com',
  'mytrashmail.com','nabala.com','naver.com','neat.email','nervmich.net','nervtansen.de',
  'netmails.com','netmails.net','neverbox.com','no-spam.ws','nobulk.com','noclickemail.com',
  'nogmailspam.info','nomail.ch','nomail.xl.cx','nomail2me.com','nomorespamemails.com',
  'nospam.ze.tc','nospam4.us','nospamfor.us','nospammail.net','nospamthanks.info',
  'nothingtoseehere.ca','nowmymail.com','nurfuerspam.de','nus.edu.sg','nwldx.com',
  'objectmail.com','obobbo.com','odaymail.com','one-time.email','oneoffemail.com',
  'oneoffmail.com','onewaymail.com','oopi.org','ordinaryamerican.net','otherinbox.com',
  'ourklips.com','outlawspam.com','ovpn.to','owlpic.com','pancakemail.com','pjjkp.com',
  'plexolan.de','pookmail.com','privacy.net','proxymail.eu','prtnx.com','punkass.com',
  'putthisinyouremail.com','qq.com','quickinbox.com','rcpt.at','reallymymail.com',
  'recode.me','recursor.net','regbypass.com','rejectmail.com','reliable-mail.com',
  'rhyta.com','rklips.com','rmqkr.net','royal.net','rppkn.com','rtrtr.com','s0ny.net',
  'safe-mail.net','safersignup.de','safetymail.info','safetypost.de','sandelf.de',
  'saynotospams.com','scatmail.com','schafmail.de','selfdestructingmail.com','sendspamhere.com',
  'sharklasers.com','shieldedmail.com','shiftmail.com','shitmail.me','shortmail.net',
  'sibmail.com','skeefmail.com','slaskpost.se','slipry.net','slopsbox.com','slowslow.de',
  'slutty.horse','smashmail.de','smellfear.com','snakemail.com','sneakemail.com',
  'snkmail.com','sofimail.com','sofort-mail.de','softpls.asia','sogetthis.com','sohu.com',
  'solvemail.info','soodonims.com','spam.la','spam.su','spam4.me','spamavert.com',
  'spambob.com','spambob.net','spambob.org','spambog.com','spambog.de','spambog.ru',
  'spambox.info','spambox.irishspringrealty.com','spambox.us','spamcannon.com',
  'spamcannon.net','spamcero.com','spamcorptastic.com','spamcowboy.com','spamcowboy.net',
  'spamcowboy.org','spamday.com','spamex.com','spamfighter.cf','spamfighter.ga',
  'spamfighter.gq','spamfighter.ml','spamfighter.tk','spamfree24.com','spamfree24.de',
  'spamfree24.eu','spamfree24.info','spamfree24.net','spamfree24.org','spamgourmet.com',
  'spamgourmet.net','spamgourmet.org','spamherelots.com','spamhereplease.com','spamhole.com',
  'spamify.com','spaminator.de','spamkill.info','spaml.com','spaml.de','spammotel.com',
  'spamobox.com','spamoff.de','spamslicer.com','spamspot.com','spamstack.net',
  'spamthis.co.uk','spamtrap.ro','spamtrail.com','spamwc.de','speed.1s.fr','spoofmail.de',
  'squizzy.de','sry.li','startkeys.com','stinkefinger.net','stop-my-spam.cf',
  'stuffmail.de','supergreatmail.com','supermailer.jp','superrito.com','superstachel.de',
  'suremail.info','svk.jp','sweetxxx.de','tafmail.com','tagyoureit.com','talkinator.com',
  'tapchicuoihoi.com','teewars.org','teleworm.com','teleworm.us','temp-mail.org',
  'temp-mail.ru','tempalias.com','tempe4mail.com','tempemail.biz','tempemail.co.za',
  'tempemail.com','tempemail.net','tempinbox.com','tempinbox.co.uk','tempmail.co',
  'tempmail.de','tempmail.eu','tempmail.it','tempmail2.com','tempmaildemo.com',
  'tempmailer.com','tempmailer.de','tempomail.fr','temporarily.de','temporarioemail.com.br',
  'temporaryemail.net','temporaryemail.us','temporaryforwarding.com','temporaryinbox.com',
  'temporarymailaddress.com','tempthe.net','thankdog.com','thankyou2010.com','thc.st',
  'thecloudindex.com','thelimestones.com','thisisnotmyrealemail.com','thismail.net',
  'throwawayemailaddress.com','tilien.com','tittbit.in','tizi.com','tmailinator.com',
  'toiea.com','toomail.biz','topranklist.de','tradermail.info','trash-amil.com',
  'trash-mail.at','trash-mail.cf','trash-mail.com','trash-mail.de','trash-mail.ga',
  'trash-mail.gq','trash-mail.ml','trash-mail.tk','trash2009.com','trashdevil.com',
  'trashdevil.de','trashemail.de','trashmail.at','trashmail.com','trashmail.de',
  'trashmail.io','trashmail.me','trashmail.net','trashmail.org','trashmail.ws',
  'trashmailer.com','trashymail.com','trashymail.net','trbvm.com','trbvn.com',
  'trialmail.de','trickmail.net','trillianpro.com','turual.com','twinmail.de',
  'tyldd.com','uggsrock.com','umail.net','unmail.ru','upliftnow.com','uplipht.com',
  'venompen.com','veryreallywow.com','vidchart.com','viditag.com','viewcastmedia.com',
  'viewcastmedia.net','viewcastmedia.org','vomoto.com','vpn.st','vsimcard.com',
  'vubby.com','wasteland.rfc822.org','watchfull.net','webemail.me','webm4il.info',
  'wegwerfadresse.de','wegwerfemail.com','wegwerfemail.de','wegwerfmail.de','wegwerfmail.net',
  'wegwerfmail.org','wh4f.org','whatiaas.com','whatpaas.com','whyspam.me','wickmail.net',
  'wilemail.com','willhackforfood.biz','willselfdestruct.com','winemaven.info',
  'wronghead.com','wuzup.net','wuzupmail.net','wwwnew.eu','x.ip6.li','xagloo.com',
  'xemaps.com','xents.com','xjoi.com','xmaily.com','xoxy.net','yapped.net',
  'yeah.net','yep.it','yogamaven.com','yomail.info','yopmail.com','yopmail.fr',
  'yopmail.gq','yopmail.net','ypmail.webarnak.fr.eu.org','yuurok.com','zehnminutenmail.de',
  'zippymail.info','zoaxe.com','zoemail.org','zomg.info','zxcv.com','zxcvbnm.com',
  'zzz.com','tempail.com','guerrillamailblock.com','grr.la','sharklasers.com',
  'guerrillamail.info','guerrillamail.biz','guerrillamail.de','guerrillamail.net',
  'guerrillamail.org','guerrillamail.com','emailondeck.com','33mail.com','maildrop.cc',
  'mailnesia.com','mailcatch.com','mailinator.com','yopmail.com','throwaway.email',
  'temp-mail.org','fakeinbox.com','mailnull.com','spamgourmet.com','trashmail.com',
  'mytemp.email','tempmail.ninja','getnada.com','mohmal.com','burnermail.io',
  'dispostable.com','mailsac.com','inboxkitten.com','tempmailo.com','emailfake.com',
  'crazymailing.com','mail.tm','internxt.com','simplelogin.io'
]);

function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  for (const d of DISPOSABLE_DOMAINS) {
    if (domain.endsWith('.' + d)) return true;
  }
  return false;
}

// ── Profanity filter (PT-BR + EN) ──
const PROFANITY_PATTERNS = [
  // PT-BR
  /\bp[uú]t[ao]?\b/i, /\bfil[hx]a?\s*d[aeo]\s*p[uú]t[ao]?\b/i, /\bcaralh[oa]?\b/i,
  /\bporra\b/i, /\bmerda\b/i, /\bc[uú]\b/i, /\bbuceta\b/i, /\bviado\b/i, /\bveado\b/i,
  /\bfoder\b/i, /\bfod[aei]\b/i, /\bfod[aei][-\s]?se\b/i, /\bvai\s*(se\s*)?f[oó]d[eê]r?\b/i,
  /\bvai\s+tomar\b/i, /\barrombad[oa]\b/i, /\bcuzã[oa]\b/i, /\bcorno\b/i,
  /\bdesgraçad[oa]\b/i, /\bimbecil\b/i, /\bidiot[ae]?\b/i, /\botári[oa]\b/i,
  /\bvagabund[oa]\b/i, /\bcacete\b/i, /\bpau\s+no\s+cu\b/i, /\bmaldito\b/i,
  /\blixo\b/i, /\bnojent[oa]\b/i, /\bpig[oa]\b/i, /\besc[rk]ot[oa]\b/i,
  /\bbab[aá]c[aá]\b/i, /\bporr[aã]\b/i, /\bfdp\b/i, /\bpqp\b/i, /\bvsf\b/i,
  /\bvtnc\b/i, /\bkrl\b/i, /\bctlh\b/i, /\bcrlh\b/i, /\btmnc\b/i,
  // EN
  /\bf+u+c+k+\b/i, /\bs+h+i+t+\b/i, /\ba+s+s+h+o+l+e+\b/i, /\bb+i+t+c+h+\b/i,
  /\bd+a+m+n+\b/i, /\bd+i+c+k+\b/i, /\bp+u+s+s+y+\b/i, /\bc+u+n+t+\b/i,
  /\bm+o+t+h+e+r+f+u+c+k/i, /\bw+h+o+r+e+\b/i, /\bb+a+s+t+a+r+d+\b/i,
  /\bn+i+g+g/i, /\bf+a+g+g?o?t?\b/i, /\bretard/i, /\bstfu\b/i, /\bgtfo\b/i,
  /\bwtf\b/i, /\bkys\b/i
];

function hasProfanity(text) {
  const normalized = text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[0@]/g, 'o').replace(/[1!|]/g, 'i').replace(/[3]/g, 'e')
    .replace(/[4]/g, 'a').replace(/[5$]/g, 's').replace(/[7]/g, 't')
    .replace(/[8]/g, 'b').replace(/\s+/g, ' ');

  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(text) || pattern.test(normalized)) return true;
  }
  return false;
}

// ── Email template ──
function buildEmailHTML(name, email, projectType, message) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#0e0e13;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0e0e13;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="padding:32px 40px;border-radius:24px 24px 0 0;background:linear-gradient(135deg,#131319 0%,#1f1f26 100%);">
<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td><span style="font-size:24px;font-weight:700;color:#f9f5fd;letter-spacing:-0.5px;">PC</span><span style="font-size:24px;font-weight:700;color:#8ff5ff;">.</span></td>
<td align="right"><span style="font-size:10px;font-weight:700;letter-spacing:3px;color:#ac89ff;text-transform:uppercase;">Nova Mensagem</span></td>
</tr></table></td></tr>
<tr><td style="height:2px;background:linear-gradient(90deg,#8ff5ff,#ac89ff,#ff59e3);"></td></tr>
<tr><td style="padding:40px;background-color:#19191f;">
<p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#f9f5fd;">Novo contato recebido!</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
<td style="padding:16px 20px;background-color:#25252d;border-radius:16px;border-left:3px solid #8ff5ff;">
<p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:2px;color:#8ff5ff;text-transform:uppercase;">Nome</p>
<p style="margin:0;font-size:16px;color:#f9f5fd;font-weight:500;">${name}</p>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
<td style="padding:16px 20px;background-color:#25252d;border-radius:16px;border-left:3px solid #ac89ff;">
<p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:2px;color:#ac89ff;text-transform:uppercase;">E-mail</p>
<a href="mailto:${email}" style="font-size:16px;color:#f9f5fd;font-weight:500;text-decoration:none;">${email}</a>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
<td style="padding:16px 20px;background-color:#25252d;border-radius:16px;border-left:3px solid #ff59e3;">
<p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:2px;color:#ff59e3;text-transform:uppercase;">Tipo de Projeto</p>
<p style="margin:0;font-size:16px;color:#f9f5fd;font-weight:500;">${projectType}</p>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;"><tr>
<td style="padding:24px;background-color:#25252d;border-radius:16px;border:1px solid rgba(143,245,255,0.1);">
<p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:2px;color:#acaab1;text-transform:uppercase;">Mensagem</p>
<p style="margin:0;font-size:15px;color:#f9f5fd;line-height:1.7;white-space:pre-wrap;">${message}</p>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<a href="mailto:${email}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,rgba(143,245,255,0.15),rgba(172,137,255,0.15));border:1px solid rgba(143,245,255,0.4);color:#8ff5ff;font-size:13px;font-weight:700;letter-spacing:2px;text-decoration:none;border-radius:12px;text-transform:uppercase;">RESPONDER &rarr;</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:24px 40px;border-radius:0 0 24px 24px;background-color:#131319;">
<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td><p style="margin:0;font-size:10px;letter-spacing:2px;color:#76747b;text-transform:uppercase;">&copy; 2026 Paulo Catarino</p></td>
<td align="right"><a href="https://www.linkedin.com/in/paulo-catarino/" style="font-size:10px;letter-spacing:2px;color:#76747b;text-decoration:none;text-transform:uppercase;">LINKEDIN</a>
<span style="color:#48474d;margin:0 8px;">&middot;</span>
<a href="https://github.com/PRCatarino" style="font-size:10px;letter-spacing:2px;color:#76747b;text-decoration:none;text-transform:uppercase;">GITHUB</a></td>
</tr></table></td></tr>
</table></td></tr></table></body></html>`;
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde um momento.' });
  }

  const { name, email, projectType, message, website } = req.body || {};

  // Honeypot
  if (website) return res.json({ success: true, id: 'ok' });

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
    return res.status(400).json({ error: 'Dados inválidos.' });
  }

  if (name.length > 100 || email.length > 254 || message.length > 1000) {
    return res.status(400).json({ error: 'Dados excedem o tamanho permitido.' });
  }

  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'E-mail inválido.' });
  }

  if (isDisposableEmail(email)) {
    return res.status(400).json({ error: 'E-mails temporários não são aceitos. Use um e-mail real.' });
  }

  if (hasXSS(name) || hasXSS(email) || hasXSS(message) || hasXSS(projectType || '')) {
    return res.status(400).json({ error: 'Conteúdo não permitido detectado.' });
  }

  const allText = `${name} ${message} ${projectType || ''}`;
  if (hasProfanity(allText)) {
    return res.status(400).json({ error: 'Conteúdo inapropriado detectado. Mantenha o profissionalismo.' });
  }

  const safeName = sanitize(name);
  const safeEmail = sanitize(email);
  const safeProject = sanitize(projectType || 'Não especificado');
  const safeMessage = sanitize(message);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Portfolio <onboarding@resend.dev>',
      to: EMAIL_TO,
      replyTo: safeEmail,
      subject: `Novo contato: ${safeName} - ${safeProject}`,
      html: buildEmailHTML(safeName, safeEmail, safeProject, safeMessage),
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Erro ao enviar. Tente novamente.' });
    }

    res.json({ success: true, id: data.id });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
};
