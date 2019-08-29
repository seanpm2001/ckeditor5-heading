/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* globals console, window, document, setTimeout */

import ClassicEditor from '@ckeditor/ckeditor5-build-classic/src/ckeditor';
import Title from '@ckeditor/ckeditor5-heading/src/title';

import { CS_CONFIG } from '@ckeditor/ckeditor5-cloud-services/tests/_utils/cloud-services-config';

ClassicEditor.builtinPlugins.push( Title );

ClassicEditor
	.create( document.querySelector( '#snippet-title' ), {
		cloudServices: CS_CONFIG
	} )
	.then( editor => {
		window.editor = editor;

		const titlePlugin = editor.plugins.get( 'Title' );
		const titleConsole = new Console( document.querySelector( '.title-console__title' ) );
		const bodyConsole = new Console( document.querySelector( '.title-console__body' ) );
		const dataConsole = new Console( document.querySelector( '.title-console__data' ) );

		editor.model.document.on( 'change:data', () => {
			titleConsole.update( titlePlugin.getTitle() );
			bodyConsole.update( titlePlugin.getBody() );
			dataConsole.update( editor.getData() );
		} );
	} )
	.catch( err => {
		console.error( err.stack );
	} );

class Console {
	constructor( element ) {
		this.element = element;
		this.consoleUpdates = 0;
		this.previousData = '';
	}

	update( data ) {
		if ( this.previousData == data ) {
			return;
		}

		this.previousData = data;

		const element = this.element;

		this.consoleUpdates++;

		element.classList.add( 'updated' );
		element.textContent = `'${ data }'`;

		setTimeout( () => {
			if ( --this.consoleUpdates == 0 ) {
				element.classList.remove( 'updated' );
			}
		}, 500 );
	}
}
