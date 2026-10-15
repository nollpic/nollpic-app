(function (root) {
  'use strict';
  function create(storage) {
    return {
      save(record) {
        if (!record?.sessionId || !['completed','timeout','abandoned'].includes(record.endReason) || record.gameId!=='ATT-001') throw Error('Invalid development result');
        const key='game-result:'+record.sessionId;
        try {
          if (storage.getItem(key)) return {saved:true,duplicate:true};
          storage.setItem(key,JSON.stringify(record));
          if(record.endReason==='completed') {
            const bestKey=['game-best',record.childId,record.gameId,record.rulesVersion,record.difficulty,record.mode].join(':');
            const best=JSON.parse(storage.getItem(bestKey)||'null');
            if(!best||record.score>best.score)storage.setItem(bestKey,JSON.stringify({sessionId:record.sessionId,score:record.score}));
          }
          return {saved:true,duplicate:false};
        } catch (_) { return {saved:false,duplicate:false}; }
      }
    };
  }
  if(typeof module==='object'&&module.exports)module.exports={create};else root.NollpicGameResults={create};
})(typeof window==='object'?window:globalThis);
