import Ember from 'ember';
import Doc from 'dummy/models/doc';

export default Ember.Route.extend({
  model: function() {
    return Doc.create();
  }
});
