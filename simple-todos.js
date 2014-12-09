Tasks = new Mongo.Collection('tasks');

if (Meteor.isClient) {
  Meteor.subscribe("tasks");
  // This code only runs on the client
  Template.body.helpers({
    tasks: function () {
      if (Session.get("hideCompleted")) {
        // If hide completed is checked, filter tasks
        return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
      } else {
        // Otherwise, return all of the tasks
        return Tasks.find({}, {sort: {createdAt: -1}});
      }
    },
    hideCompleted: function () {
      return Session.get("hideCompleted");
    },
    // counts all uncompleted tasks
    incompleteCount: function () {
      return Tasks.find({ checked: { $ne: true}}).count();
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

  Template.body.events({
    "submit .new-task": function (event) {
      // This function is called when the new task form is submitted

      var text = event.target.text.value;

      Meteor.call("addTask", text);

      // Clear form
      event.target.text.value = "";

      // Prevent default form submit
      return false;
      console.log(event);
    },

    "change .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
    }
  });

  Template.task.events({
    "click .toggled-checked": function(){
      Meteor.call("setChecked", this._id, ! this.checked);
    },

    "click .delete": function(){
      Meteor.call("deleteTask", this._id);
    },

    "click .toggle-private": function(){
      Meteor.call("setPrivate", this._id, ! this.private);
    }
  });


  Template.task.helpers({
    isOwner: function(){
      return this.owner === Meteor.userId();
    }
  });
}

Meteor.methods({
  addTask: function(text) {
    if(! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },

  deleteTask: function(taskId){
    Tasks.remove(taskId);
  },

  setChecked: function(taskId, setChecked){
    Tasks.update(taskId, {$set: { private: setToPrivate}});
  },

  setPrivate: function (taskId, setToPrivate) {
    var task = Tasks.findOne(taskId);

    // Make sure only the task owner can make a task private
    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.update(taskId, { $set: { private: setToPrivate } });
  }

});

if(Meteor.isServer){
  Meteor.publish("tasks", function () {
    return Tasks.find({
      $or: [
      { private: {$ne: true} },
      { owner: this.userId }
      ]
    });
  });
}
