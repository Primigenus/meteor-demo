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
    if (!this.name) return false;
    return this.name.toLowerCase() === Meteor.user().profile.name.toLowerCase();
  }

  Template.qers.sort = function() {
    return Session.get("sortby");
  }

  Template.qers.selected = function() {
    return Session.equals("selected", this._id) ? "selected" : "";
  }

  Template.qers.events = {
    'click .button': function() {
      Meteor.call("plusone", this._id);
    },
    'click tbody tr': function() {
      Session.set('selected', this._id);
    },
    'click thead th': function(evt) {
      Session.set("sortby", evt.target.getAttribute("data-sortby"));
      Session.set("sortdir", Session.get("sortdir") * -1);
    }
  }

  Template.qers.sortby = function(col) {
    if (Session.equals("sortby", col) && Session.equals("sortdir", 1))
      return "&uarr;"
    else if (Session.equals("sortby", col) && Session.equals("sortdir", -1))
      return "&darr;";
    else return "";
  }

  Template.qers.helpers({
    formatdate: function(date) {
      return moment(date).fromNow();
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
        var isMe = docs[0].name.toLowerCase() === Meteor.user().profile.name.toLowerCase();
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

    Meteor.methods({
      plusone: function(id) {
        var record = Qers.findOne(id);
        if (_.contains(record.voters, Meteor.user()._id))
          return;
        Qers.update(id, {$inc: {plusones: 1}, $addToSet: {voters: Meteor.user()._id}});
      },
      reset: function() {
        Qers.remove({});

        var qers = [
          {name: "Chris Waalberg", role: "Planningslaaf", joindate: new Date("2005-04-01")},
          {name: "Christiaan Hees", role: "Programmeur", joindate: new Date("2008-09-01")},
          {name: "Elaine Oliver", role: "Interaction Engineer", joindate: new Date("2009-09-01")},
          {name: "Jelle Visser", role: "Gameguru", joindate: new Date("2008-08-01")},
          {name: "Johan Huijkman", role: "Interaction Engineer", joindate: new Date("2010-01-01")},
          {name: "Kars Veling", role: "Founder", joindate: new Date("2000-05-01")},
          {name: "Martin Kool", role: "Crazy inventor", joindate: new Date("2001-04-01")},
          {name: "Rahul Choudhury", role: "Captain Longhair", joindate: new Date("2006-04-01")},
          {name: "Richard Lems", role: "Illustrator", joindate: new Date("2011-11-01")},
          {name: "Sjoerd Visscher", role: "Sjoogle", joindate: new Date("2001-08-01")},
          {name: "Lukas van Driel", role: "Captain Healthy", joindate: new Date("2005-02-01")}
        ];
        _.each(qers, function(item) {
          item.plusones = 0;
          item.voters = [];
          Qers.insert(item);
        });
      }
    })

  });
}