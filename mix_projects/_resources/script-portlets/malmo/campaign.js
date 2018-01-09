( function(){

    'use strict';

    var METADATA = {
            image: 			'campaignTopImage',
            imageText: 		'campaignTopText',
            campaignMore:	'campaignReadMore',
            campaignApply: 'campaignApplyJob',
            campaignTitle: 'campaignTitle',
            campaignLayout:'campaignLayout'
        },
        propertyUtil 			= require( 'PropertyUtil' ),
        portletContextUtil 	    = require( 'PortletContextUtil' ),
        currentPage 			= portletContextUtil.getCurrentPage(),
        layout					= propertyUtil.getString( currentPage, METADATA.campaignLayout, '' ),
        image,
        imageText,
        imageTitle,
        readMore                = propertyUtil.getNestedString( currentPage, METADATA.campaignMore, 'URI', '' ),
        applyJob                = propertyUtil.getNestedString( currentPage, METADATA.campaignApply, 'URI', '' );

    image = propertyUtil.getString( currentPage, METADATA.image, '' );

    if ( image && !''.equals( image ) ) {
        out.println( '<div style="background-image: url(\'' + image + '\')" class="campaignTopImage">' );
        if ( 'Startsida'.equals( layout) ){

            imageText = propertyUtil.getString( currentPage, METADATA.imageText, '' ).split( '##' );
            out.println( '	<div class="campaignTopImageText">' );
            out.println( '		<h1>' + propertyUtil.getString( currentPage, METADATA.campaignTitle, '' ) + '</h1>' );
            out.println( '		<p class="normal blueBackground">' + imageText[ 0 ] + '</p>' );
            out.println( '		<p class="normal bold redBackground displayInline"><a href="' + readMore + '"' +
                         ' title="">' + imageText[ 1 ] + '</a></p>' );
            out.println( '		<p class="normal bold orangeBackground displayInline"><a href="' + applyJob + '"' +
                         ' title="">' + imageText[ 2 ] + '</a></p>' );

        } else {

            imageText = propertyUtil.getString( currentPage, METADATA.imageText, '' ).split( '##' );
            out.println( '	<div class="campaignTopImageText--personLayout">' );
            out.println( '		<h1>' + propertyUtil.getString( currentPage, METADATA.campaignTitle, '' ) + '</h1>' );
            out.println( '		<p class="normal">' + imageText[ 0 ] + '<span>' + imageText[ 1 ] + '</span></p>' );

        }

        out.println( '	</div>' );
        out.println( '	<div class="campaignArrow"></div>' );

        /*
         if ( 'Startsida'.equals( layout) ){
         out.println( '		<div class="applyAllJobs"><div><p class="normal">Se alla lediga jobb</p><p class="normal small">Sök nu</p></div></div>' );
         }
         */
        out.println( '</div>' );
    } else {



    }

}() );