import { Mongo } from 'meteor/mongo';
import { Analyze } from 'meteor/qualia:analyze-observes';

let SampleCollection = new Mongo.Collection('sample_collection'),
    buildCollection = () => {
      SampleCollection.remove({});
      for (let i=0; i < 20; i++) {
        SampleCollection.insert({ i });
      }
    },
    withObserve = ({ selector={}, fields, sort, limit, skip, disableOplog=false, callbacks={} }, callback) => {
      let cursor = SampleCollection.find(selector, { fields, sort, limit, skip, disableOplog }),
          observe = cursor.observe(callbacks)
      ;
      callback();
      observe.stop();
    }
;

buildCollection();

Tinytest.add('analyze-observes - ordered observe', test => {
  withObserve({ callbacks: { addedAt(){} } }, key => {
    let result = Object.values(Analyze.go())[0];
    test.isTrue(_.size(result.oplogBlockers) === 1 && result.oplogBlockers.ordered);
  });
});

Tinytest.add('analyze-observes - disable oplog', test => {
  withObserve({ disableOplog: true }, key => {
    let result = Object.values(Analyze.go())[0];
    test.isTrue(_.size(result.oplogBlockers) === 1 && result.oplogBlockers.oplogDisabled);
  });
});

Tinytest.add('analyze-observes - has skip', test => {
  withObserve({ skip: 10 }, key => {
    let result = Object.values(Analyze.go())[0];
    test.isTrue(_.size(result.oplogBlockers) === 1 && result.oplogBlockers.hasSkip);
  });
});

Tinytest.add('analyze-observes - limit without sort', test => {
  withObserve({ limit: 10 }, key => {
    let result = Object.values(Analyze.go())[0];
    test.isTrue(_.size(result.oplogBlockers) === 1 && result.oplogBlockers.unsortedLimit);
  });
});

Tinytest.add('analyze-observes - limit with sort', test => {
  withObserve({ limit: 10, sort: {i: 1} }, key => {
    let result = Object.values(Analyze.go())[0];
    test.isTrue(_.size(result.oplogBlockers) === 0);
  });
});

Tinytest.add('analyze-observes - bad projection', test => {
  withObserve({ fields: { a: { $slice: 10 } } }, key => {
    let result = Object.values(Analyze.go())[0];
    test.isTrue(_.size(result.oplogBlockers) === 1 && result.oplogBlockers.badProjection);
  });
});

Tinytest.add('analyze-observes - has $where', test => {
  withObserve({ selector: { $where: 'true' } }, key => {
    let result = Object.values(Analyze.go())[0];
    test.isTrue(_.size(result.oplogBlockers) === 1 && result.oplogBlockers.fancySelector);
  });
});


Tinytest.add('analyze-observes - bad sort', test => {
  withObserve({ sort: { $natural: 1} }, key => {
    let result = Object.values(Analyze.go())[0];
    test.isTrue(_.size(result.oplogBlockers) === 1 && result.oplogBlockers.badSort);
  });
});
