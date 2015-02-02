import Ember from 'ember';

/**
 * @class TextEditorComponent
 * @extends Ember.Component
 */
export default Ember.Component.extend({
  classNames: ['TextEditor'],
  attributeBindings: ['contenteditable'],
  contenteditable: 'true',
  text: '',

  /**
   * The DOM element that contains this component
   *
   * @property elem
   * @type {HTMLDivElement}
   */
  elem: function() {
    return this.$()[0];
  }.property(),

  /**
   * The paragraphs of the editor text, split on newlines
   *
   * @property paragraphs
   * @type {Array(String)}
   */
  paragraphs: function() {
    return this.get('_text').split('\n').map(function addBreaks(str) {
      return str || new Ember.Handlebars.SafeString('<br>');
    });
  }.property('_text'),

  /**
   * The sections of the document as HTMLDivElements
   *
   * @property sections
   * @type {Array(HTMLDivElement)}
   */
  sections: function() {
    return this.$('.document-section').toArray();
  }.property().volatile(),

  /**
   * The currently active section of the document
   *
   * @property activeSection
   * @type {HTMLElement}
   */
  activeSection: function() {
    return this.$('.document-section.active-section')[0];
  }.property().volatile(),

  /**
   * A method to be called when the "blur" event is fired
   *
   * @property onBlur
   * @type {Function}
   */
  onBlur: function() {
    return function onBlur() {
      this.unsetActiveSection();
      this.updateText();
    }.bind(this);
  }.property(),

  /**
   * A method to be called when the "focus" event is fired
   *
   * @property onFocus
   * @type {Function}
   */
  onFocus: function() {
    return function onFocus() {
      this.setActiveSection();
      this.updateText();
    }.bind(this);
  }.property(),

  /**
   * A method to be called when the "keydown" event is fired
   *
   * @property onKeydown
   * @type {Function}
   */
  onKeydown: function() {
    return function onKeydown(e) {
      this.setActiveSection();
      this.preventEmpty(e);
      this.insertTab(e);
      this.updateText();
    }.bind(this);
  }.property(),

  /**
   * A method to be called when the "keyup" event is fired
   *
   * @property onKeyup
   * @type {Function}
   */
  onKeyup: function() {
    return function onKeyup(e) {
      this.setActiveSection();
      this.preventEmpty(e);
      this.updateText();
    }.bind(this);
  }.property(),

  /**
   * A method to be called when the "paste" event is fired
   *
   * It will cancel the default paste action and insert plain text from the
   * clipboard.
   *
   * @property onPaste
   * @type {Function}
   */
  onPaste: function() {
    return function onPaste(e) {
      e.preventDefault();
      var text = e.clipboardData.getData('text/plain');

      if (text) {
        document.execCommand('insertText', false, text);
      }
      this.updateText();
    }.bind(this);
  }.property(),

  /**
   * Bind DOM events to methods on this component.
   *
   * @method bindDOMEvents
   */
  bindDOMEvents: function() {
    var elem      = this.get('elem');
    var onKeydown = this.get('onKeydown').bind(this);
    var onKeyup   = this.get('onKeyup').bind(this);
    var onFocus   = this.get('onFocus').bind(this);
    var onBlur    = this.get('onBlur').bind(this);
    var onPaste   = this.get('onPaste').bind(this);

    elem.addEventListener('focus',     onFocus);
    elem.addEventListener('blur',      onBlur);
    elem.addEventListener('keydown',   onKeydown);
    elem.addEventListener('keyup',     onKeyup);
    elem.addEventListener('mousedown', onFocus);
    elem.addEventListener('paste',     onPaste);
  }.on('didInsertElement'),

  /**
   * Unbind DOM events from methods on this component.
   *
   * @method unbindDOMEvents
   */
  unbindDOMEvents: function() {
    var elem      = this.get('elem');
    var onKeydown = this.get('onKeydown').bind(this);
    var onKeyup   = this.get('onKeyup').bind(this);
    var onFocus   = this.get('onFocus').bind(this);
    var onBlur    = this.get('onBlur').bind(this);
    var onPaste   = this.get('onPaste').bind(this);

    elem.removeEventListener('focus',     onFocus);
    elem.removeEventListener('blur',      onBlur);
    elem.removeEventListener('keydown',   onKeydown);
    elem.removeEventListener('keyup',     onKeyup);
    elem.removeEventListener('mousedown', onFocus);
    elem.removeEventListener('paste',     onPaste);
  }.on('willDestroyElement'),

  /**
   * Insert 2 spaces if the user types the "tab" key.
   *
   * @method insertTab
   * @param {Event} e the event that was fired
   */
  insertTab: function(e) {
    var activeSection = this.get('activeSection');
    var tabCode       = 9;

    if (!activeSection) { return; }

    if (e.keyCode === tabCode) {
      e.preventDefault();
      document.execCommand('insertText', false, '  ');
    }
  },

  /**
   * Prevent the last section from being deleted.
   *
   * @method preventEmpty
   * @param {Event} e the event that was fired
   */
  preventEmpty: function(e) {
    var activeSection = this.get('activeSection');
    var sections      = this.get('sections');
    var backspaceCode = 8;

    if (sections.length > 1 || !activeSection) { return; }

    if (e.keyCode === backspaceCode && activeSection.innerHTML === '<br>') {
      e.preventDefault();
    }
  },

  /**
   * Set the active section to the currently focused section.
   *
   * @method setActiveSection
   */
  setActiveSection: function() {
    // Run after render so that there's time for the selection to be applied.
    Ember.run.scheduleOnce('afterRender', function() {
      var activeSection = this.get('activeSection');
      var sel           = window.getSelection();
      var selectedNode  = sel.anchorNode;
      var focusedNode;

      if (activeSection) {
        activeSection.classList.remove('active-section');
      }

      while (!focusedNode) {
        if (selectedNode && selectedNode.nodeType === 1 &&
            selectedNode.classList.contains('document-section')) {
          focusedNode = selectedNode;
        } else {
          if (selectedNode === null) {
            break;
          } else {
            selectedNode = selectedNode.parentNode;
          }
        }
      }

      if (focusedNode) {
        focusedNode.classList.add('active-section');
      } else {
        this.focusSection(this.get('sections.firstObject'));
      }
    }.bind(this));
  },

  /**
   * Remove the active state from the active section.
   *
   * @method unsetActiveSection
   */
  unsetActiveSection: function() {
    var activeSection = this.get('activeSection');

    if (activeSection) {
      activeSection.classList.remove('active-section');
    }
  },

  /**
   * When the element is first inserted, append a new section to the document
   * and focus on it.
   *
   * @method didInsertElement
   */
  didInsertElement: function() {
    var sections = this.get('sections'),
      contenteditable = this.get('contenteditable');
      contenteditable = contenteditable && contenteditable !== "false";
    if (contenteditable){
      this.focusSection(sections[sections.length - 1]);
    }
  },

  /**
   * Append a new section to the document.
   *
   * A blank section is an HTMLDivElement with an HTMLBRElement inside of it as
   * a placeholder so that we can focus on the empty section.
   *
   * @method appendSection
   * @return {HTMLDivElement} the newly appended section
   */
  appendSection: function() {
    var activeSection = this.get('activeSection');
    var br            = document.createElement('br');
    var elem          = this.get('elem');
    var section       = document.createElement('div');

    section.classList.add('document-section', 'active-section');
    section.appendChild(br);

    if (activeSection) {
      this.$(activeSection).after(section);
    } else {
      elem.appendChild(section);
    }

    return section;
  },

  /**
   * Focus on a given section of the document.
   *
   * @method focusSection
   * @param {HTMLDivElement} section the section to be focused on
   */
  focusSection: function(section) {
    var range = document.createRange();
    var sel   = window.getSelection();
    var pos   = section.childNodes.length;

    range.setStart(section, pos);
    range.setEnd(section, pos);

    sel.removeAllRanges();
    sel.addRange(range);
  },

  /**
   * Update the bounded text property
   *
   * @method updateText
   */
  updateText: function(){
    var texts = []
    this.$('.document-section').each(function(i, section){
      texts.push(Ember.$(section).text());
    });
    texts = texts.join('\n');
    this.set('text', texts);
  },
  /**
   * When the element is first inserted, set the private _text field
   *
   * @method setInitialText
   */
  setInitialText: function(){
    this.set('_text', this.get('text'));
  }.on('init')
});
