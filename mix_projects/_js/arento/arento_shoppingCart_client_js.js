var BV = BV || {},
    // Toolbox Library
    _b = _b || {};

( function () {
    /* jshint ignore:start */
    // jscs:disable
    var cache   = {};
    _b.template = function tmpl( str, data ) {
        // Figure out if we're getting a template, or if we need to
        // load the template - and be sure to cache the result.
        var fn = !/\W/.test( str ) ?
            cache[ str ] = cache[ str ] ||
                tmpl( document.getElementById( str ).innerHTML ) :
            // Generate a reusable function that will serve as a template
            // generator (and which will be cached).
            new Function( "obj",
                "var p=[],print=function(){p.push.apply(p,arguments);};" +
                // Introduce the data as local variables using with(){}
                "with(obj){p.push('" +
                // Convert the template into pure JavaScript

                str
                    .replace( /[\r\t\n]/g, " " )
                    .split( "<%" ).join( "\t" )
                    .replace( /((^|%>)[^\t]*)'/g, "$1\r" )
                    .replace( /\t=(.*?)%>/g, "',$1,'" )
                    .split( "\t" ).join( "');" )
                    .split( "%>" ).join( "p.push('" )
                    .split( "\r" ).join( "\\'" ) +
                "');}return p.join('');" );
        // Provide some basic currying to the user
        return data ? fn( data ) : fn;
    };
    // jscs:enable
    /* jshint ignore:end */
}() );


var jsonResponseGetCart;
function ajaxAction( aDataObject ){

    var backend = '/4.675446715f31d31b2a208/12.675446715f31d31b2a211.portlet',
        jq = jQuery;


    jq.ajax({
        url: backend,
        data: aDataObject,
        success: function( data ) {

            if ( aDataObject.action == 'get' ) {
                jsonResponseGetCart = JSON.parse( data );
                jq( '.shoppingCartTotalPrice' ).text( jsonResponseGetCart[ 'response' ][ 'body' ][ 'getCart' ][ 'cart' ][ 'totalPrice' ] );
                jq( '.shoppingCartSummary' ).append( '<pre style="white-space: pre-wrap;">'+ JSON.stringify( jsonResponseGetCart ) +'</pre>' );
            }
        }
    });
}

var shoppingCart
if ( sessionStorage.getItem( 'shoppingCart' ) == null ) {
    shoppingCart = [];
} else {
    shoppingCart = JSON.parse( sessionStorage.getItem( 'shoppingCart' ) );
}

/*
 function controlIfProductExistsInShoppingCart( anArtNo ){
 var localArtNo;

 for( var i = 0; i < shoppingCart.length; i++) {
 localArtNo = shoppingCart[ i ].artNo;

 if ( localArtNo === anArtNo ) {
 shoppingCart[ i ].amount += 1;

 return true;
 }
 }

 return false;
 }
 */

function addToShoppingCart( anArtNo, aProductName, anImgSrc, aDesc, aFromDate, aToDate, anAmount ){

    /*
     var product,
     existingProduct = controlIfProductExistsInShoppingCart( anArtNo );

     if ( !existingProduct ) {
     product = {};
     product.artNo = anArtNo;
     product.productName = aProductName;
     product.imgSrc = anImgSrc;
     product.desc = aDesc;
     product.fromDate = aFromDate;
     product.toDate = aToDate;
     product.amount = anAmount;
     shoppingCart.push( product );
     }
     */

    var product = {};
    product.artNo = anArtNo;
    product.productName = aProductName;
    product.imgSrc = anImgSrc;
    product.desc = aDesc;
    product.fromDate = aFromDate;
    product.toDate = aToDate;
    product.amount = anAmount;
    shoppingCart.push( product );

    saveShoppingCartToSession();

}

function removeProductFromShoppingCartArray( aJQ, anIndex ){

    var productToRemove = shoppingCart[ anIndex ];

    shoppingCart.splice( anIndex, 1 );
    saveShoppingCartToSession();
    updateShoppingCartText( aJQ );

    productToRemove.action = 'remove';
    ajaxAction( productToRemove );
    ajaxAction( { action: 'get' } );

}

function updateShoppingCartText( aJQ ) {
    var noArts = shoppingCart.length,
        textHolder = aJQ('.shopingCart > div');

    if (noArts == 0) {
        textHolder.text('Orderlistan är tom');
    } else if (noArts == 1) {
        textHolder.text(noArts + ' Produkt');
    } else {
        textHolder.text(noArts + ' Produkter');
    }
}

function saveShoppingCartToSession(){
    sessionStorage.setItem( 'shoppingCart', JSON.stringify( shoppingCart ) );
}

( function( jq ){

    function addClickToShoppingCart(){
        jq( '.shopingCart' ).on( 'click', function( e ){
            var noArts = shoppingCart.length;
            if ( noArts > 0 ) {
                window.location.href = '/4.675446715f31d31b2a26b.html';
            }
        });
    }

    function getTomorrowsDate() {
        var tomorrowsDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
            day = tomorrowsDate.getDate(),
            month = tomorrowsDate.getMonth() + 1,
            year = tomorrowsDate.getFullYear();

        return year + '-' + month + '-' + day;
    }

    function addClickOrderButton(){
        jq( '.bvOrderButton' ).on( 'click', function( e ){
            var contentContainer    = jq( this ).closest( '.bvArentoProductContent' ),
                artNo               = contentContainer.find( '.bvArentoProductArtnr' ).text().replace( 'Artnr: ', '' ),
                productName         = contentContainer.find( '.bvArentoProductName' ).text(),
                fromDate            = contentContainer.find( 'input[name="daterange"]' ).first().val(),
                toDate              = contentContainer.find( 'input[name="daterange"]' ).last().val(),
                imgSrc              = contentContainer.parent().find( '.bvArentoProductImage img' ).attr( 'src' ),
                desc                = '',
                amount              = 1,
                dataObject          = { action: 'add', artNo: artNo, fromDate: fromDate, toDate: toDate };

            if ( !fromDate ) {
                fromDate = getTomorrowsDate();
            }

            if ( !toDate ) {
                toDate = getTomorrowsDate();
            }

            jq.each( contentContainer.find( '.bvArentoProductDes' ), function( i, k ){
                desc += jq( k ).text() + ' ';
            } );

            addToShoppingCart( artNo, productName, imgSrc, desc, fromDate, toDate, amount );
            updateShoppingCartText( jq );
            ajaxAction( dataObject );

        });
    }

    function addClickRemoveItemInShoppingCart(){

        jq( '.ShoppingCartAdminRemove' ).on( 'click', function( e ){
            var that       = jq( this ),
                parentLi   = that.closest( 'li' ),
                parentUl   = parentLi.closest( 'ul' ),
                index      = parentLi.index();

            removeProductFromShoppingCartArray( jq, index );
            parentLi.remove();
        });
    }

    function addEmptyShoppingCart(){

        jq( '.shoppingCartEmptyCart button' ).on( 'click', function( e ){

            ajaxAction( { action: 'empty' } );
            shoppingCart = [];
            saveShoppingCartToSession();
            updateShoppingCartText( jq );
            ajaxAction( { action: 'get' } );

            jq( '#shoppingCartViewItems' ).empty();
        });

    }

    jq( window ).on( 'load', function( e ){
        addClickOrderButton();
        addClickToShoppingCart();
        addClickRemoveItemInShoppingCart();
        addEmptyShoppingCart();

        if ( shoppingCart.length > 0 ) {
            updateShoppingCartText( jq );
        }
    });

    /* Shopping cart number spinner */
    jq( document ).on( 'click', '.number-spinner button', function () {
        var btn = jq(this),
            oldValue = btn.closest('.number-spinner').find('input').val().trim(),
            newVal = 0;

        if ( btn.attr('data-dir') == 'up' ) {
            newVal = parseInt( oldValue ) + 1;
        } else {
            if ( oldValue > 1 ) {
                newVal = parseInt( oldValue ) - 1;
            } else {
                newVal = 1;
            }
        }
        btn.closest( '.number-spinner' ).find( 'input' ).val(newVal);
    });
    /* Shopping cart number spinner */

}( jQuery ) );