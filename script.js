
/************************/
/* ANYWHERE             */
/************************/

People = new Meteor.Collection("people");

// Enable to pull in data from q42.nl instead of local
/*
q42nl = DDP.connect("http://q42.nl");
People = new Meteor.Collection("Employees", q42nl);
q42nl.subscribe("employees");
*/



/************************/
/* CLIENT               */
/************************/

if (Meteor.isClient) {

  // Set some default session values when starting up
  Meteor.startup(function() {
    Session.setDefault("sortby", "name");
    Session.setDefault("sortdir", 1);
  });

  // The list of people, which can be sorted depending on session values
  Template.people.people = function () {
    var sortby = Session.get("sortby");
    var sortdir = Session.get("sortdir");
    var sort = {};
    sort[sortby] = sortdir;
    return People.find({}, {sort: sort});
  }

  // How many people there are
  Template.people.numberPeople = function() {
    return People.find().count();
  }

  Template.people.plusones = function() {
    return this.plusones || 0;
  }

  Template.people.isMe = function() {
    if (!this.name) return false;
    return this.name.toLowerCase().indexOf(Meteor.user().profile.name.toLowerCase()) == 0;
  }

  Template.people.disabled = function() {
    return _.contains(this.voters, Meteor.user()._id) ? " disabled" : "";
  }

  Template.people.sort = function() {
    return Session.get("sortby");
  }

  Template.people.selected = function() {
    return Session.equals("selected", this._id) ? "selected" : "";
  }

  Template.people.lastvote = function() {
    if (this.lastvote)
      return moment(this.lastvote).fromNow();
    return "never";
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
      if (date)
        return moment(date).fromNow();
    },
    bgc: function(plusones) {
      var max = People.findOne({}, {sort: {plusones: -1}}).plusones;
      max = max || 1;
      plusones = plusones || 0;
      var n = ~~(plusones / max * 100 + 155);
      var c = [Math.max(0, n - 80), n, Math.max(0, n - 80)].join(",")
      return "background: rgb(" + c + ")";
    }
  })
}



/************************/
/* SERVER               */
/************************/

if (Meteor.isServer) {

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
          subject: "Someone reached +42!",
          text: newDoc.name + " reached +42 votes in the Meteor Demo! W000000t"
        });
      }
    }
  });

  Meteor.methods({
    plusone: function(id) {
      var record = People.findOne(id);
      if (_.contains(record.voters, Meteor.user()._id))
        return;
      People.update(id, {$inc: {plusones: 1}, $addToSet: {voters: Meteor.user()._id}, $set: {lastvote: new Date()}});
    }
  });












/************************/
/* DEMO UTILITY METHODS */
/************************/

  Meteor.methods({
    empty: function() {
      People.remove({});
    },
    reset: function() {
      People.remove({});

      var people = [
        "Aidan Mauricio","Ande Oey","Anouk Rentier","Arthur Mooiman","Aurel Bansagi","Bart Heemskerk","Boris Matthijssen","Bram Janssens","Carel Wagenaar","Casper van der Hout","Chantal Olieman","Charles","Daan Schipper","Daniel","Davey Struijk","Dennis van Peer","Emiel Rietdijk","Erik meulman","Ervan","Eva Anker","Eveline","Felix van Doorn","Floris Verburg","Gijs Wterings","Giovan Angela","Herman","Hugo Platell","Ike Rijsdijk","Jaap Heijligers","Jan van Rosmalen","Jasper Nieuwdorp","Jeffrey de Lange","Jenny Tjan","Jesper Peterse","Jesse Slim","Jorien Knipping","Kaper Kooijman","Lars Heijenrath","Le Chau Lu","Lindy koel","Lindy","Lisann Spek","Louis Sikkes","Luuk Frankena","Maarten Flikkema","Marjolein Bouwmeester","Martijn Dwars","Martijn Steenbergen","Martijn","Mathieu Post","Matthijs Verzijl","Matthijs van Dorth","Milen van Osch","Noor van Ruyven","Nordin van Nes","Pascal Remeijsen","Patricia van Marlen","Paul Verkooijen","Piet de Vaere","Renee Swinkels","Rick Wieman","Rik Nijessen","Rob van den Berg","Robert Jan Schlimbach","Roderick Schravendeel","Rolf Rengers","Roy Graafmans","Ruben Starmans","Rutger Rauws","Ruth Koole","Sander Ploegsma","Sander van den Oever","Saskia Vertregt","Sjoerd Jansma","Sjors Kole","Stephan dumasy","Sven Popping","Sven","Tessa van Hartingsveldt","Thomas Smith","Thomas Uitdewillegen","Tim van der Lippe","Tom Brouws","Tom Harting","Tom Runia","Vincent van der Eijk","Wessel","Wouter Posdijk","gijs bruining","inez","lianne bruijns","lindy"
      ];

      _.each(people, function(person) {
          People.insert({
            name: person,
            plusones: 0,
            voters: []
          });
      });
    }
  });





}