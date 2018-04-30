import { MongoInternals } from 'meteor/mongo';
import { Minimongo } from 'meteor/minimongo';

let Analyze = {

  initialize() {
    return this;
  },

  go() {
    let observeCursors = this.getObserveCursors(),
        cursorAnalysis = {}
    ;

    observeCursors.forEach(cursor => {
      let result = this.analyzeCursor(cursor);
      cursorAnalysis[JSON.stringify(cursor)] = result;
    });

    return cursorAnalysis;
  },

  getObserveCursors() {
    return Object
      .keys(MongoInternals.defaultRemoteCollectionDriver().mongo._observeMultiplexers)
      .map(cursorString => JSON.parse(cursorString))
    ;
  },

  analyzeCursor(cursor) {
    let oplogBlockers = {};
    _.each(this.oplogBlockerTests, (blocker, id) => {
      if (blocker.test(cursor)) {
        oplogBlockers[id] = blocker.explain(cursor);
      }
    });
    return { cursor, oplogBlockers };
  },

  oplogBlockerTests: {
    ordered: {
      test(cursor) {
        return cursor.ordered;
      },
      explain(cursor) {
        return `Used at least one ordered observe callback. Try to avoid using any of the following: addedAt, changedAt, movedTo, removedAt, addedBefore, movedBefore.`;
      },
    },
    badSelector: {
      test(cursor) {
        try {
          let matcher = new Minimongo.Matcher(cursor.selector);
          return false;
        }
        catch(e) {
          return true;
        }
      },
      explain(cursor) {
        return `Minimongo couldn't compile the selector. Remove any $ operators that aren't available in older versions of Mongo.`;
      },
    },
    oplogDisabled: {
      test(cursor) {
        return cursor.options.disableOplog || cursor.options._disableOplog;
      },
      explain(cursor) {
        return `The oplog driver was manually disabled. Don't set disableOplog or _disableOplog.`;
      },
    },
    hasSkip: {
      test(cursor) {
        return cursor.options.skip;
      },
      explain(cursor) {
        return `A non-zero skip was set. Remove the skip.`;
      },
    },
    unsortedLimit: {
      test(cursor) {
        return cursor.options.limit && !cursor.options.sort;
      },
      explain(cursor) {
        return `A limit was set without adding a sort. Add a sort or remove the limit.`;
      },
    },
    badProjection: {
      test(cursor) {
        if (!cursor.options.fields) {
          return false;
        }
        try {
          LocalCollection._checkSupportedProjection(cursor.options.fields);
        }
        catch (e) {
          return true;
        }
      },
      explain(cursor) {
        return `The field projection configuration couldn't be compiled. Remove any $ operators from the fields option.`;
      },
    },
    fancySelector: {
      test(cursor) {
        try {
          let matcher = new Minimongo.Matcher(cursor.selector);
          return matcher.hasWhere() || matcher.hasGeoQuery();
        }
        catch(e) {
          return false;
        }
      },
      explain(cursor) {
        return `The selector contained $where or $near. Remove these operators.`;
      },
    },
    badSort: {
      test(cursor) {
        if (!cursor.options.sort) {
          return false;
        }
        try {
          let matcher = new Minimongo.Matcher(cursor.selector),
              sorter = new Minimongo.Sorter(cursor.options.sort, { matcher })
          ;
        }
        catch(e) {
          return true;
        }
      },
      explain(cursor) {
        return `Minimongo couldn't compile the sort. Check your syntax and make sure you aren't sorting by $natural.`;
      },
    },

  },

}.initialize();

export { Analyze };
