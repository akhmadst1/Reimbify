const { Firestore } = require('@google-cloud/firestore');

async function getHistory() {
  const db = new Firestore();

  const predictCollection = db.collection('predictions');
  const snapshot = await predictCollection.get();

  if (snapshot.empty) {
    return [];
  }

  const history = [];
  snapshot.forEach(doc => {
    history.push({
      id: doc.id,
      history: doc.data(),
    });
  });

  return history;
}

module.exports = getHistory;
