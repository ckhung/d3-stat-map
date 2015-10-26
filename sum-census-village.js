// 資料來源： http://data.gov.tw/node/8411
// 注意： csvtojson 處理完之後，
// 苗栗縣苗栗市南勢里 宜蘭縣三星鄉大隱村 兩處出錯

var fs = require('fs');
var census_village = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
var i, j, k, town, census_town = {};

for (i=0; i<census_village.length; ++i) {
    town = census_village[i]['區域別'].replace(/(一|二)$/, '區');
    // 把原始資料當中的 「鳳山一」、「鳳山二」 合併為 「鳳山區」；
    // 「三民一」、「三民二」 合併為 「三民區」
//    if (town.indexOf('臺中市') < 0) continue;
    if (!(town in census_town)) {
	census_town[town] = { '男':[], '女':[] };
	for (j=0; j<=100; ++j)
	    census_town[town]['男'][j] = census_town[town]['女'][j] = 0;
    }
    for (k in census_village[i]) {
	if (match = /^(\d+)歲-(男|女)$/.exec(k)) {
	    census_town[town][match[2]][match[1]]
		+= census_village[i][k];
	} else if (match = /^(\d+)歲以上-(男|女)$/.exec(k)) {
	    census_town[town][match[2]][100] += census_village[i][k];
	}
    }
}

var result = [];
var male = 0, female = 0;

for (town in census_town) {
    var entry = {
	'name': town,
	'男': census_town[town]['男'],
	'女': census_town[town]['女']
    };
    for (i=1; i<=100; ++i) {
	entry['男'][i] += entry['男'][i-1];
	entry['女'][i] += entry['女'][i-1];
    }
    result.push(entry);
    male += entry['男'][100];
    female += entry['女'][100];
}

console.log(JSON.stringify(result, null, 2));
// console.log('總人口： ' + male + '男 + ' + female + '女');

