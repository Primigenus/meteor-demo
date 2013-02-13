var Qers = new Meteor.Collection("qers");

if (Meteor.isClient) {
  Meteor.startup(function() {
    Session.set("sortby", "name");
    Session.set("sortdir", 1);
  });

  Template.qers.qers = function () {
    var sortby = Session.get("sortby");
    var sortdir = Session.get("sortdir");
    var sort = {};
    sort[sortby] = sortdir;
    return Qers.find({}, {sort: sort});
  };

  Template.qers.isMe = function() {
    return this.name.toLowerCase() === Meteor.user().profile.name.split(" ")[0].toLowerCase();
  }

  Template.qers.sort = function() {
    return Session.get("sortby");
  }

  Template.qers.events = {
    'click .button': function() {
      Qers.update(this._id, {$inc: {plusones: 1}});
    },
    'click thead th': function(evt) {
      Session.set("sortby", evt.target.getAttribute("data-sortby"));
      Session.set("sortdir", Session.get("sortdir") * -1);
    }
  }

  Template.qers.sortby = function(col) {
    return Session.equals("sortby", col)
      && Session.equals("sortdir", 1) ? "&uarr;" : "&darr;";
  }

  Template.qers.helpers({
    formatdate: function(date) {
      return moment(date, "YYYY-MM-DD").fromNow();
    },
    bgc: function(plusones) {
      var max = Qers.findOne({}, {sort: {plusones: -1}}).plusones;
      max = max || 1;
      plusones = plusones || 0;
      var n = ~~(plusones / max * 100 + 155);
      var c = [Math.max(0, n - 60),n,Math.max(0, n - 60)].join(",")
      return "background: rgb(" + c + ")";
    }
  })
}

if (Meteor.isServer) {
  Meteor.startup(function () {

    Qers.allow({
      insert: function() { return true; },
      update: function(userId, docs, fields, modifier) {
        // only allow updates that increment plusones by 1
        var isMe = docs[0].name.toLowerCase() === Meteor.user().profile.name.split(" ")[0].toLowerCase();
        var isPlusOne = _.keys(modifier).length == 1 && modifier["$inc"] && modifier["$inc"].plusones == 1;
        return isPlusOne && !isMe;
      }
    });

    Qers.find({}).observe({
      changed: function(newDoc, atIndex, oldDoc) {
        if (newDoc.plusones >= 42 && oldDoc.plusones < 42) {
          Email.send({
            to: "rahul@q42.nl",
            from: "rahul@q42.nl",
            subject: "Iemand heeft +42 bereikt!",
            text: newDoc.name + " heeft +42 gescoord met het Meteor bedenktijdje! W000000t"
          });
        }
      }
    });

  });
}