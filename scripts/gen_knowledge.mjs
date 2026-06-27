import fs from "fs";
function K(id,catId,catName,title,group,def,syntax,tags,freq,params,examples){return{knowledgeId:id,categoryId:catId,categoryName:catName,title,group,definition:def,syntax,tags,usageFrequency:freq||80,parameters:params||[],examples:examples||[],relatedQuestionIds:[]};}
const ek=[K("excel_know_001","excel","Excel","VLOOKUP","查找与引用","垂直查找","=VLOOKUP(v,r,c,[m])",["查找"],98,[],[{title:"查找姓名",code:"=VLOOKUP(E2,A:B,2,FALSE)"}])
];console.log(ek.length);
fs.writeFileSync("data/knowledge/all_knowledge.json",JSON.stringify([...ek],null,2));
console.log("done");
