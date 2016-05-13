import fuzzy from 'clj-fuzzy'

let getScore = (a, b) => fuzzy.metrics.dice(a, b)

export function fuzzyMap(listA, listB, threshold=0.8) {
	let tupleArray = listA.map(a => {
		var maxScore = 0, maxScoringVal;
		for (var i = 0; i < listB.length; i++) {
			let b = listB[i];
			let score = getScore(a,b);
			if (score === 1) return [a,b];
			if (score > maxScore) {
				maxScore = score;
				maxScoringVal = b
			}
		}
		if (maxScore >= threshold) return [a,maxScoringVal];
		else return [a,null];
	})

	// convert the tuple array into a javascript object
	let map = {};
	tupleArray.forEach(([a,b]) => map[a] = b);
	return map;
}
