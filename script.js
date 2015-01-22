
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
    Session.setDefault("numResults", 20);
  });

  // Load more results when we scroll to the bottom of the page
  var throttled = _.throttle(function() {
    var atBottom = $(document).height() - ($(window).height() + $(document).scrollTop()) === 0;
    if (atBottom)
      Session.set("numResults", 5 + Session.get("numResults"))
  }, 300);
  $(window).scroll(throttled);

  Template.people.helpers({

    // The list of people, which can be sorted depending
    // on session values
    people: function() {
      var sortby = Session.get("sortby");
      var sortdir = Session.get("sortdir");
      var sort = {};
      sort[sortby] = sortdir;
      return People.find({}, {sort: sort, limit: Session.get("numResults")});
    },

    // How many people there are
    numberPeople: function() {
      return People.find().count();
    },

    // Show the current plusones or zero if the property
    // doesn't exist
    plusones: function() {
      return this.plusones || 0;
    },

    // Hacky check to determine whether this item is the same
    // as the currently logged in user
    isMe: function() {
      if (!this.name) return false;
      return this.name.toLowerCase().indexOf(
        Meteor.user().profile.name.toLowerCase()) == 0;
    },

    // Whether to disable the +1 button if the current user
    // already voted for that person
    disabled: function() {
      return _.contains(this.voters, Meteor.user()._id)
        ? " disabled" : "";
    },

    // The currently sorted column
    sort: function() {
      return Session.get("sortby");
    },

    // Whether the current item is selected or not
    selected: function() {
      return Session.equals("selected", this._id)
        ? "selected" : "";
    },

    // Format a date to display when the last vote was added
    // for this person
    lastvote: function() {
      if (this.lastvote)
        return moment(this.lastvote).fromNow();
      return "never";
    },

    // Draw an arrow up or down depending on whether and how
    // we're sorting this column
    sortby: function(col) {
      if (Session.equals("sortby", col) &&
        Session.equals("sortdir", 1))
        return "&uarr;"
      else if (Session.equals("sortby", col) &&
        Session.equals("sortdir", -1))
        return "&darr;";
      else return "";
    },

    // Generate a shade of green depending on how many votes
    // the maximum upvoted user has
    bgc: function(plusones) {
      var max = People.findOne({}, {sort: {plusones: -1}})
        .plusones;
      max = max || 1;
      plusones = plusones || 0;
      var n = ~~(plusones / max * 100 + 155);
      var c = [Math.max(0, n - 80), n, Math.max(0, n - 80)]
        .join(",")
      return "background: rgb(" + c + ")";
    }

  });

  // Define some events for the people template
  Template.people.events({
    'click .button': function() {
      // Call the server method "plusone" with the current
      // person's id when we click the +1 button
      Meteor.call("plusone", this._id);
    },
    'click tbody tr': function() {
      // Select the current item when we click it
      Session.set('selected', this._id);
    },
    'click thead th': function(evt) {
      // Sort by the column we just clicked, or reverse the
      // sort order if already sorting by it
      Session.set("sortby",
        evt.target.getAttribute("data-sortby"));
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

    // only allow updates that increment plusones by 1 and
    // disallow upvoting yourself
    update: function(userId, docs, fields, modifier) {
      var isMe = docs[0].name.toLowerCase() ===
        Meteor.user().profile.name.toLowerCase();
      var isPlusOne = _.keys(modifier).length == 1
        && modifier["$inc"] && modifier["$inc"].plusones == 1;
      return isPlusOne && !isMe;
    }
  });

  // Watch the People collection and act if a change matches
  // our observer
  People.find({}).observe({
    changed: function(newDoc, atIndex, oldDoc) {
      // If a person is upvoted beyond 42 upvotes, send Rahul
      // an email :)
      if (newDoc.plusones >= 42 && oldDoc.plusones < 42) {
        Email.send({
          to: "rahul@q42.nl",
          from: "rahul@q42.nl",
          subject: "Someone reached +42!",
          text: newDoc.name +
            " reached +42 votes in the Meteor Demo! W000000t"
        });
      }
    }
  });

  // Define some API methods that the client can use
  Meteor.methods({
    // Plusone a person by ID. Doesn't do anything if the
    // current user already voted for this person.
    plusone: function(id) {
      var record = People.findOne(id);
      if (_.contains(record.voters, Meteor.user()._id))
        return;
      People.update(id, {
        $inc: {plusones: 1},
        $addToSet: {voters: Meteor.user()._id},
        $set: {lastvote: new Date()}
      });
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
      var people = ["Aaron Triplett","Adam","Adam Berman","Adam Sadovsky","Alan Strahsburg","Albert Chang","Alec Dara-Abrams","Alex Kin","Alex(ander) Craig","Alexander Malitsky","Alla Il'chuk","Alpesh","Alvin Lai","amir farrahi","Amish","Amit Bharadwaj","Amogh R Rao","Anbuselvan Periannan","Andreas","Andres Osorio Plata","Andrew Glover","Andrew Zavgorodniy","Anil Srivastava","Anirban Kundu","Anna Kucheinyk","Anna Vasilko","Anthony Vella","Anton Kondrashenkov","Anuj Jaiswal","Arie Radilla","Art","Arun Kumar","Arup","Arvind","Arvind Raj","Ashish","Ashwin Vaghasia","Austin Wu","Avina","Banit","Barbara F","Ben Halverson","bernard van haecke","bfonacier","Bill Overstreet","Bill Rainey","Bo Ericsson","Borys","Brandon Gray","Brian Coburn","Bruno Sanches","C L","Carlos Araya","Carol St.Louis","Cathie Liu","Cemal Sert","Chacko N","chakradhar","Charles d'Harcourt","Charles Tung","chase chou","Chien-Chung Chang","Chitra Tatachar","Chris","Chris","Chris Forno","Chris Zankel","Christopher Jesudurai","Chuck H","Cliff Yap","Collin Green","Curtis Schumacher","Dan Baran","Dan Bikle","Dan Carnese","Dan D","Daniel K Griffin","Daniel Mendalka","Daniel Yu","David Hwang","David Lai","David Mihal","Debra Chi","Deepthi K","Dharmi","Dipak","Diwakar Cherukumilli","Don Hejna","Doris Chen","Doug","Dustin Brand","Dylan Kirby","Earl Bingham","Ed Katz","ed young","Eduardo Rodrigues","Elena Tan","Emmanuel","Erin Pangilinan","evans","Evgeny","F4Lens","Firat Karakusoglu","Frank van Gilluwe","Garima Gupta","gary","Gene Escober","Geoffrey Russell","Glen","Gonzalo Gasca Meza","Hari Kunamneni","Hemanth Sridhara Ashalatha","Henri Muurimaa","Henry","Henry","Hongjian Zhao","hoss","hriya","Hung Vo","Hyunjung Lee","Igor Kucheinyk","isaac","ishika","Ismail","J F","Jack Xu","james","James Allen","James Downey","James Feagans","Janice","jason","Jason Campbell","Jason Chuang","Jason Han","Jason Kafalas","Jay Karma","Jeff Brod","Jeff Nainaparampil","Jeff S","Jeff Wang","Jerry Lin","Jerry Si","Joe Barnhart","Joel Tello","John","John","John Bateman","John Hamilton","John Wang","Johnny Kim","Jon","Jon Deibel","Jonah Back","Jonatan K","Joonas Lehtinen","Jorge Jaramillo","Joshua Woodward","Juanita","Justina Cheng","Kaamel Kermaani","Kamran","Kandy Nachimuthu","Karel Vuong","Karl Pohl","Kelvin Wong","Ken Park","Kevin Bjorke","Kevin mo","Kevin Nilson","Organizer","Kevin Tucker","Khanh Dao","Khoa Phan","Ki Lim","Kris Carlsen","Kristen Brann","Ksenia Pachurova","Kuliantxo","Kumar","Kunfeng Chen","Kyrylo Kochubyey","Lars Hidde","Laura Klemme","Lauren Kahn","lawrence","Leif Åstrand","leonard cheong","Lingan","Lionel","Lou de los Re","Lu Zhang","Luke Mertens","M.C. Wilson","MacLane Wilkison","Maksym Taran","Manish Chhabra","Manu Suryavansh","Manuel Carrasco","Marcello Damasceno","Mariano Pardo","mario","Assistant Organizer","mariya","Mark Scholtz","markd","Martin Kuba","Matt Phillips","Matthew Hancock","Meenakshi Ramamoorthi","Melody","Michael","Michael Adams","Michael Carter","Co-Organizer","Michael Schoendorf","michelle","Mike","mkolosick","Mrugen Deshmukh","NancyPhan","Nathan Thomas Mosher","Never Follow","Newton C","Nikita Beloglazov","Nikki L","noa grant","Oleg","Oliver Zhang","p","P.V.","Patrick Thompson","Paul Lee","Pavan Shivaram","Perry Chow","Peter","Peter","Peter Chaivre","Peter O'Connor","Peter Simanyi","Peter Vanderbilt","Peter Zen","Prashanth Govindaraj","Praveen Gupta","Praveen Kumar","preeti","Promila","Rahul Agarwal","Rahul Choudhury","Raisa","Rajan","Rajiv Gupta","Raman Aleksandrovich","Ranjith Tellakula","Raphael Kochuvaried","Ravi Theja Mittapalli","Reshad","Rich Gossweiler","Richard Yee","Rick Evans","Rob","Rob","Robert Bellandi","Roni Michaels","Roy","Roy Arsan","ruchita rathi","Ruslan","Sam","Samir Savla","Sandeep Adwankar","Sanjay Shroff","santhosh","Sarada Pachalla","Sarah Ross","Sasmita","Scott Evans","Senthilnathan Vadivel","Serg Limich","Shashanka Panuganti","Shay Nir","Shirley","Shishir G","Shyam Ravindranathan","shyamal bapodara","sina","Sokthea D. Mov","solomon wu","Son Thai","Soo Hwan Park","Spicy Zinc","Srikanth Kavoori","Steve Chan","Steve Pimen","Suhas","Sumit","Sunil Sabat","Suresh","Suresh Govindaraj","suresh koya","Sushmita Dey","tex","Thomas","Tomas Rokicki","Travis kim","Varun Stifler-Arora","Vasishta Kyatham","Victor Chugunov","Victor Korshun","vidya","Viji Balas","Vikram Angrish","Vipul Nadoda","Vlad Nakonechnyi","wang","Wen Lee","Wenbo Zhu","William H","Wing","Young Keun Park","Yow-Hann","Yun"];

      _.each(_.first(people, 42), function(person) {
          People.insert({
            name: person,
            plusones: 0,
            voters: []
          });
      });
    }
  });





}
