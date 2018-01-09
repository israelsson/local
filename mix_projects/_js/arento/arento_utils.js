/* globals jQuery */

var _b = _b || {};

( function () {

    'use strict';

    _b.jq               = jQuery;
    _b.getTextFromJSON  = function getTextFromJSON ( anObject ){

        if ( !anObject || _b.jq.isEmptyObject( anObject ) ) {
            return '<br />';
        }

        return anObject;
    };

    _b.makeDatePickers  = function makeDatePickers(){

        _b.jq( 'input[name="daterange"]' ).datepicker({
            altFormat: 'yy-mm-dd',
            dateFormat: 'yy-mm-dd'
        });

    };

}() );