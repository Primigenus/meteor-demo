
/************************/
/* ANYWHERE             */
/************************/

People = new Mongo.Collection("people");

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

  Template.people.helpers({

    // The list of people, which can be sorted depending on session values
    people: function() {
      var sortby = Session.get("sortby");
      var sortdir = Session.get("sortdir");
      var sort = {};
      sort[sortby] = sortdir;
      return People.find({}, {sort: sort});
    },

    // How many people there are
    numberPeople: function() {
      return People.find().count();
    },

    // Show the current plusones or zero if the property doesn't exist
    plusones: function() {
      return this.plusones || 0;
    },

    // Hacky check to determine whether this item is the same as the currently logged in user
    isMe: function() {
      if (!this.name) return false;
      return this.name.toLowerCase().indexOf(Meteor.user().profile.name.toLowerCase()) == 0;
    },

    // Whether to disable the +1 button if the current user already voted for that person
    disabled: function() {
      return _.contains(this.voters, Meteor.user()._id) ? " disabled" : "";
    },

    // The currently sorted column
    sort: function() {
      return Session.get("sortby");
    },

    // Whether the current item is selected or not
    selected: function() {
      return Session.equals("selected", this._id) ? "selected" : "";
    },

    // Format a date to display when the last vote was added for this person
    lastvote: function() {
      if (this.lastvote)
        return moment(this.lastvote).fromNow();
      return "never";
    },

    // Draw an arrow up or down depending on whether and how we're sorting this column
    sortby: function(col) {
      if (Session.equals("sortby", col) && Session.equals("sortdir", 1))
        return "&uarr;"
      else if (Session.equals("sortby", col) && Session.equals("sortdir", -1))
        return "&darr;";
      else return "";
    },

    // Format a date using the moment.js library
    formatdate: function(date) {
      if (date)
        return moment(date).fromNow();
    },

    // Generate a shade of green depending on how many votes the maximum upvoted user has
    bgc: function(plusones) {
      var max = People.findOne({}, {sort: {plusones: -1}}).plusones;
      max = max || 1;
      plusones = plusones || 0;
      var n = ~~(plusones / max * 100 + 155);
      var c = [Math.max(0, n - 80), n, Math.max(0, n - 80)].join(",")
      return "background: rgb(" + c + ")";
    }

  });

  // Define some events for the people template
  Template.people.events({
    'click .button': function() {
      // Call the server method "plusone" with the current person's id when we click the +1 button
      Meteor.call("plusone", this._id);
    },
    'click tbody tr': function() {
      // Select the current item when we click it
      Session.set('selected', this._id);
    },
    'click thead th': function(evt) {
      // Sort by the column we just clicked, or reverse the sort order if already sorting by it
      Session.set("sortby", evt.target.getAttribute("data-sortby"));
      Session.set("sortdir", Session.get("sortdir") * -1);
    }
  });
  
}



/************************/
/* SERVER               */
/************************/

if (Meteor.isServer) {

  // Define some access rights for the People collection
  People.allow({
    // Allow all inserts
    insert: function() { return true; },

    // only allow updates that increment plusones by 1 and disallow upvoting yourself
    update: function(userId, docs, fields, modifier) {
      var isMe = docs[0].name.toLowerCase() === Meteor.user().profile.name.toLowerCase();
      var isPlusOne = _.keys(modifier).length == 1 && modifier["$inc"] && modifier["$inc"].plusones == 1;
      return isPlusOne && !isMe;
    }
  });

  // Watch the People collection and act if a change matches our observer
  People.find({}).observe({
    changed: function(newDoc, atIndex, oldDoc) {
      // If a person is upvoted beyond 42 upvotes, send Rahul an email :)
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

  // Define some API methods that the client can use
  Meteor.methods({
    // Plusone a person by ID. Doesn't do anything if the current user already voted for this person.
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

      // Prefill the database with people who signed up for this talk :)
      var people = [
        "Alex Shepko",
        "Alexander Meesters",
        "Ali Sahin",
        "Anand Graves",
        "André Gonçalves",
        "arnoud",
        "Besma Mcharek-Boussif",
        "Bob van Oorschot",
        "Boite Witte",
        "Charif Mews",
        "chris",
        "Christine",
        "danny sukdeo",
        "Dave van Soest",
        "David Spreekmeester",
        "David van der Does",
        "Dorien",
        "Erik Pragt",
        "Filip Van Harreveld",
        "George Jinga",
        "Guido Bouman",
        "Harmen",
        "Henk Gescher",
        "Jaroslav",
        "Jiro Ghianni",
        "João Carmona",
        "Kah Tang",
        "Karen Sijbrandij",
        "Koen van der Keijl",
        "Leo van Snippenburg",
        "Lon Boonen",
        "Maarten",
        "Marco de Jongh",
        "Mark Hendriks",
        "Martijn Brekelmans",
        "Martijn laarman",
        "Meindert Hart",
        "Michiel Grootegoed",
        "Michiel ter Reehorst",
        "Nicolas",
        "NooitAf",
        "Rahul Choudhury",
        "Remco Veldkamp",
        "Richard Japenga",
        "Rien Daamen",
        "Robbert",
        "Robin Reekers",
        "Thomas Goijarts",
        "Tim",
        "Óli Óskarsson"
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