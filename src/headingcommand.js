/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module heading/headingcommand
 */

import Range from '@ckeditor/ckeditor5-engine/src/model/range';
import Command from '@ckeditor/ckeditor5-core/src/command/command';
import Selection from '@ckeditor/ckeditor5-engine/src/model/selection';
import Position from '@ckeditor/ckeditor5-engine/src/model/position';
import first from '@ckeditor/ckeditor5-utils/src/first';

/**
 * The heading command. It is used by the {@link module:heading/heading~Heading heading feature} to apply headings.
 *
 * @extends module:core/command/command~Command
 */
export default class HeadingCommand extends Command {
	/**
	 * Creates an instance of the command.
	 *
	 * @param {module:core/editor/editor~Editor} editor Editor instance.
	 * @param {String} modelElement Name of the element which this command will apply in the model.
	 */
	constructor( editor, modelElement ) {
		super( editor );

		/**
		 * Unique identifier of the command, also element's name in the model.
		 * See {@link module:heading/heading~HeadingOption}.
		 *
		 * @readonly
		 * @member {String}
		 */
		this.modelElement = modelElement;

		/**
		 * Value of the command, indicating whether it is applied in the context
		 * of current {@link module:engine/model/document~Document#selection selection}.
		 *
		 * @readonly
		 * @observable
		 * @member {Boolean}
		 */
		this.set( 'value', false );

		// Update current value each time changes are done on document.
		this.listenTo( editor.document, 'changesDone', () => {
			this.refreshValue();
			this.refreshState();
		} );
	}

	/**
	 * Executes command.
	 *
	 * @protected
	 * @param {Object} [options] Options for executed command.
	 * @param {module:engine/model/batch~Batch} [options.batch] Batch to collect all the change steps.
	 * New batch will be created if this option is not set.
	 */
	_doExecute( options = {} ) {
		const editor = this.editor;
		const document = editor.document;

		// If current option is same as new option - toggle already applied option back to default one.
		const shouldRemove = this.value;

		document.enqueueChanges( () => {
			const batch = options.batch || document.batch();
			const blocks = Array.from( document.selection.getSelectedBlocks() )
				.filter( block => {
					return checkCanBecomeHeading( block, this.modelElement, document.schema );
				} );

			for ( const block of blocks ) {
				// When removing applied option.
				if ( shouldRemove ) {
					if ( block.is( this.modelElement ) ) {
						// Apply paragraph to the selection withing that particular block only instead
						// of working on the entire document selection.
						const selection = new Selection();
						selection.addRange( Range.createIn( block ) );

						// Share the batch with the paragraph command.
						editor.execute( 'paragraph', { selection, batch } );
					}
				}
				// When applying new option.
				else if ( !block.is( this.modelElement ) ) {
					batch.rename( block, this.modelElement );
				}
			}
		} );
	}

	/**
	 * Updates command's {@link #value value} based on current selection.
	 */
	refreshValue() {
		const block = first( this.editor.document.selection.getSelectedBlocks() );

		this.value = !!block && block.is( this.modelElement );
	}

	/**
	 * @inheritDoc
	 */
	_checkEnabled() {
		const document = this.editor.document;
		const block = first( document.selection.getSelectedBlocks() );

		return !!block && checkCanBecomeHeading( block, this.modelElement, document.schema );
	}
}

// Checks whether the given block can be replaced by a specific heading.
//
// @private
// @param {module:engine/model/element~Element} block A block to be tested.
// @param {module:heading/headingcommand~HeadingCommand#modelElement} heading Command element name in the model.
// @param {module:engine/model/schema~Schema} schema The schema of the document.
// @returns {Boolean}
function checkCanBecomeHeading( block, heading, schema ) {
	return schema.check( {
		name: heading,
		inside: Position.createBefore( block )
	} );
}
