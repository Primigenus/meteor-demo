var Students = new Meteor.Collection("students");

if (Meteor.isClient) {
  Meteor.startup(function() {
    Session.setDefault("sortby", "name");
    Session.setDefault("sortdir", 1);
  });

  Template.students.students = function () {
    var sortby = Session.get("sortby");
    var sortdir = Session.get("sortdir");
    var sort = {};
    sort[sortby] = sortdir;
    return Students.find({}, {sort: sort});
  };

  Template.students.isMe = function() {
    if (!this.name) return false;
    return this.name.toLowerCase() === Meteor.user().profile.name.toLowerCase();
  }

  Template.students.sort = function() {
    return Session.get("sortby");
  }

  Template.students.joindate = function() {
    return moment(this.joindate).fromNow();
  }

  Template.students.selected = function() {
    return Session.equals("selected", this._id) ? "selected" : "";
  }

  Template.students.events = {
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

  Template.students.sortby = function(col) {
    if (Session.equals("sortby", col) && Session.equals("sortdir", 1))
      return "&uarr;"
    else if (Session.equals("sortby", col) && Session.equals("sortdir", -1))
      return "&darr;";
    else return "";
  }

  Template.students.helpers({
    bgc: function(plusones) {
      var max = Students.findOne({}, {sort: {plusones: -1}}).plusones;
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

    Students.allow({
      insert: function() { return true; },
      update: function(userId, docs, fields, modifier) {
        // only allow updates that increment plusones by 1
        var isMe = docs[0].name.toLowerCase() === Meteor.user().profile.name.toLowerCase();
        var isPlusOne = _.keys(modifier).length == 1 && modifier["$inc"] && modifier["$inc"].plusones == 1;
        return isPlusOne && !isMe;
      }
    });

    Students.find({}).observe({
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
        var record = Students.findOne(id);
        if (_.contains(record.voters, Meteor.user()._id))
          return;
        Students.update(id, {$inc: {plusones: 1}, $addToSet: {voters: Meteor.user()._id}});
      },
      reset: function() {
        Students.remove({});

        var students = [
          {name: "Danny de Wit", studentnr: 500618681},
          {name: "Dennis Tel", studentnr: 500517067},
          {name: "Donny Oexman", studentnr: 500618824},
          {name: "Donny Wals", studentnr: 500617634},
          {name: "Evan Reurekas", studentnr: 500610444},
          {name: "Geert Beskers", studentnr: 500626558},
          {name: "Imro Breur", studentnr: 500617963},
          {name: "Jeroen Hoebe", studentnr: 500531191},
          {name: "Leon Smit", studentnr: 500622091},
          {name: "Mark Ootes", studentnr: 500621729},
          {name: "Martijn van der Woude", studentnr: 500630454},
          {name: "Mehdi Ebadi", studentnr: 500127613},
          {name: "Melvin Beemer", studentnr: 500600490},
          {name: "Paul Bot", studentnr: 500626912},
          {name: "Pim Meijer", studentnr: 500617245},
          {name: "Rick van Schalkwijk", studentnr: 500618919},
          {name: "Robbert van der Steenhoven", studentnr: 500624577},
          {name: "Stijn van der Vegt", studentnr: 500545938},
          {name: "Thomas Machielsen", studentnr: 500620602},
          {name: "Titus Wormer", studentnr: 500625392},
          {name: "Tjerk Smit", studentnr: 500627708},
          {name: "Vincent Karsten", studentnr: 500615673},
          {name: "Wiljan Slofstra", studentnr: 500621743}
        ];
        _.each(students, function(item) {
          item.plusones = 0;
          item.voters = [];
          Students.insert(item);
        });
      }
    })

  });
}