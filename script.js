var People = new Meteor.Collection("people");

if (Meteor.isClient) {
  Meteor.startup(function() {
    Session.set("sortby", "name");
    Session.set("sortdir", 1);
  });

  Template.people.people = function () {
    var sortby = Session.get("sortby");
    var sortdir = Session.get("sortdir");
    var sort = {};
    sort[sortby] = sortdir;
    return People.find({}, {sort: sort});
  };

  Template.people.isMe = function() {
    if (!this.name) return false;
    return this.name.toLowerCase() === Meteor.user().profile.name.toLowerCase();
  }

  Template.people.sort = function() {
    return Session.get("sortby");
  }

  Template.people.selected = function() {
    return Session.equals("selected", this._id) ? "selected" : "";
  }

  Template.people.events = {
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

  Template.people.sortby = function(col) {
    if (Session.equals("sortby", col) && Session.equals("sortdir", 1))
      return "&uarr;"
    else if (Session.equals("sortby", col) && Session.equals("sortdir", -1))
      return "&darr;";
    else return "";
  }

  Template.people.helpers({
    formatdate: function(date) {
      return moment(date).fromNow();
    },
    bgc: function(plusones) {
      var max = People.findOne({}, {sort: {plusones: -1}}).plusones;
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

    People.allow({
      insert: function() { return true; },
      update: function(userId, docs, fields, modifier) {
        // only allow updates that increment plusones by 1
        var isMe = docs[0].name.toLowerCase() === Meteor.user().profile.name.toLowerCase();
        var isPlusOne = _.keys(modifier).length == 1 && modifier["$inc"] && modifier["$inc"].plusones == 1;
        return isPlusOne && !isMe;
      }
    });

    People.find({}).observe({
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
        var record = People.findOne(id);
        if (_.contains(record.voters, Meteor.user()._id))
          return;
        People.update(id, {$inc: {plusones: 1}, $addToSet: {voters: Meteor.user()._id}});
      }
    });












/************************/
/* DEMO UTILITY METHODS */
/************************/

    const MEETUP_KEY = null;

    Meteor.methods({
      empty: function() {
        People.remove({});
      },
      reset: function() {
        People.remove({});

        if (MEETUP_KEY == null) {
          console.log("Meetup API key has not been defined.");
          return;
        }

        var meetupId = 122161962;
        var response = Meteor.http.get('http://api.meetup.com/2/rsvps?event_id=' + meetupId + '&key=' + MEETUP_KEY);
        _.each(response.data.results, function(rsvp) {
          if (rsvp.response == "yes")
          People.insert({
            name: rsvp.member.name,
            plusones: 0,
            voters: [],
            role: "",
            joindate: new Date(rsvp.created)
          });
        });
      }
    });






  });
}