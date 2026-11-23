document.addEventListener('DOMContentLoaded',()=>{
 const eur=n=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
 const get=id=>document.getElementById(id);
 function simulate(){const unpaid=Math.max(0,Number(get('impaye')?.value||0));const margin=Number(get('marge')?.value||0);const sales=Math.max(0,Number(get('ventes')?.value||0));const dso=Math.max(0,Number(get('jours')?.value||0));const result=get('result-sim');if(!result)return;
 if(!(margin>0&&margin<=100)){result.textContent='Indique une marge sur coûts variables comprise entre 0 et 100 %.';return;}
 const replacement=unpaid/(margin/100);const financing=sales/365*dso;
 get('result-sim').innerHTML=`<div>Chiffre d’affaires supplémentaire pour compenser l’impayé :</div><div class="number">${eur(replacement)}</div><p>Avec ${margin}% de marge sur coûts variables, une perte définitive de ${eur(unpaid)} exige ${eur(replacement)} de ventes supplémentaires pour reconstituer cette marge.</p><hr style="border:0;border-top:1px solid #3c555a"><p>À titre d'illustration, ${dso} jours de ventes représentent environ <strong style="color:#c6f29c">${eur(financing)}</strong> de chiffre d'affaires TTC ou HT selon le montant saisi, non encore encaissé dans un modèle stable et linéaire.</p>`;
 }
 ['impaye','marge','ventes','jours'].forEach(id=>get(id)?.addEventListener('input',simulate));simulate();

 // Outil DSO : calcul entièrement local, aucune donnée transmise.
 const dsoCa=get('dso-ca'), dsoDays=get('dso-gain'), dsoResult=get('dso-result'), dsoDetail=get('dso-detail');
 function computeDsoGain(){
   if(!dsoCa||!dsoDays||!dsoResult)return;
   const sales=Number(dsoCa.value), days=Number(dsoDays.value);
   if(!dsoCa.value||!dsoDays.value||!Number.isFinite(sales)||!Number.isFinite(days)||sales<0||sales>1e12||days<0||days>360){
     dsoResult.textContent='—';
     if(dsoDetail)dsoDetail.textContent='Indique un chiffre d’affaires positif et un gain entre 0 et 360 jours.';
     return;
   }
   dsoResult.textContent=eur(sales/360*days);
   if(dsoDetail)dsoDetail.textContent='Estimation sur une base de 360 jours, à ventes constantes et activité régulière.';
 }
 [dsoCa,dsoDays].forEach(input=>input?.addEventListener('input',computeDsoGain));
 computeDsoGain();

 const params = new URLSearchParams(window.location.search);
 const source = params.get('sujet');
 const article = params.get('origine');
 const fromUnpaidArticle = article === 'combien-coute-un-impaye';
 const simulatorContact = get('sim-contact');

 if (fromUnpaidArticle && simulatorContact) {
   const url = new URL(simulatorContact.href);
   url.searchParams.set('origine', article);
   simulatorContact.href = url.href;
 }

 const sourceField = get('source-article');
 if (sourceField && source && /^[a-z0-9-]{1,100}$/.test(source)) {
   sourceField.value = source;
 }

 const articleField = get('article-origine');
 if (articleField && ((source === 'simulateur' && fromUnpaidArticle) || (source === 'calcul-dso' && article === 'facturation-electronique-2027-tresorerie'))) {
   articleField.value = article;
 }

 const form = document.forms.namedItem('prise-de-contact');
 if (form) {
   form.hidden = false;
   form.addEventListener('submit', event => {
     event.preventDefault();
     const data = new FormData(form);
     const fields = [
       ['Nom', 'nom'], ['E-mail', 'email'], ['Téléphone', 'telephone'],
       ['Entreprise', 'societe'], ['Profil', 'profil'], ['Taille', 'taille'],
       ['Objectif', 'priorite'], ['Parcours', 'source-article'],
       ['Article de départ', 'article-origine'], ['Score du diagnostic', 'diagnostic-score']
     ];
     const details = fields
       .map(([label, name]) => [label, data.get(name)?.trim()])
       .filter(([, value]) => value)
       .map(([label, value]) => label + ' : ' + value);
     const subject = encodeURIComponent(data.get('besoin'));
     const body = encodeURIComponent([data.get('message').trim(), '', ...details].join('\n'));
     window.location.href = `mailto:nobaddebts@gmail.com?subject=${subject}&body=${body}`;
   });
 }

 if (form && source === 'calcul-dso') {
   const besoin = get('besoin'), message = get('message');
   if(besoin)besoin.value='Financer mon poste clients';
   if(message)message.placeholder='Je viens de tester le calculateur DSO et je souhaite comprendre comment améliorer mes encaissements...';
 }
 if (form && source === 'simulateur') {
   get('besoin').value = 'Des impayés ou retards de paiement';
   get('message').placeholder = 'Quel risque d’impayé aimerais-tu réduire ? Décris la situation en quelques lignes.';
 }
});
// V3 : questionnaire pédagogique calculé localement. Aucun envoi de résultats sans action volontaire.
document.addEventListener('DOMContentLoaded',()=>{
 const quiz=document.getElementById('quiz-form');
 const source=new URLSearchParams(location.search);
 const scoreField=document.getElementById('diagnostic-score');
 const score = source.get('score');
 if (scoreField && source.get('sujet') === 'autodiagnostic' && /^(?:[0-9]|1[0-4])$/.test(score ?? '')) {
   scoreField.value = score;
 }
 const msg=document.getElementById('message');
 if(msg&&source.get('sujet')==='autodiagnostic')msg.placeholder='Je viens de faire l’autodiagnostic et je souhaite échanger sur mes retards de paiement, ma couverture ou mon besoin de trésorerie.';
 if(quiz){
   const progress=()=>{const count=new Set([...quiz.querySelectorAll('input[type=radio]:checked')].map(x=>x.name)).size;
     document.getElementById('progress-bar').style.width=(count/7*100)+'%';
     document.getElementById('progress-label').textContent=count+' / 7 réponses';};
   quiz.addEventListener('change',progress);
   quiz.addEventListener('reset',()=>{requestAnimationFrame(()=>{progress();document.getElementById('diagnostic-result').innerHTML='';});});
   quiz.addEventListener('submit',(event)=>{
     event.preventDefault();
     if(!quiz.reportValidity())return;
     const data=new FormData(quiz);
     const names=['dependance','retard','pilotage','relance','protection','delai','cash'];
     const points=names.reduce((sum,n)=>sum+Number(data.get(n)||0),0);
     const max=14;
     let level,advice;
     if(points<=4){level='Les fondamentaux semblent plutôt maîtrisés';advice='Continue à suivre les retards, à ajuster les limites clients et à documenter les exceptions. Vérifie surtout la concentration de tes plus grosses créances.';}
     else if(points<=9){level='Quelques points méritent une vérification';advice='Commence par les retards récurrents, la concentration des créances et la formalisation des relances. Mets à jour tes règles avant qu’un gros impayé n’arrive.';}
     else{level='Plusieurs signaux invitent à agir';advice='Établis une liste priorisée des créances, contacte les clients en retard et examine rapidement tes moyens de prévention, de garantie et de financement.';}
     const url='contact.html?sujet=autodiagnostic&score='+encodeURIComponent(points);
     document.getElementById('diagnostic-result').innerHTML=`<div class="result-panel"><div class="card-tag" style="color:#c6f29c">Résultat pédagogique</div><div class="number">${points} / ${max}</div><h3 style="color:white;margin-top:14px">${level}</h3><p>${advice}</p><p class="fine" style="color:#c5d7d2">Indicateur de pratiques, sans valeur de notation de crédit ni prédiction de défaillance.</p><a class="btn" href="${url}">Discuter de mon résultat ↗</a></div>`;
     document.getElementById('diagnostic-result').scrollIntoView({behavior:'smooth',block:'center'});
   });
 }
});
