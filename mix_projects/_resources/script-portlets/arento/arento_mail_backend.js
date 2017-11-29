/* globals request, Packages, out */

/*
 * @author: Anders Israelsson, Bouvet
 * @version: 1.0
 *
 * Mail config at server object must be done to be able to send mail.
 *
 */

( function(){

    'use strict';

    var servletRequest   = request.getServletRequest(),
        session          = servletRequest.getSession(),
        token            = session.getAttribute( 'kobra-token' ),
        utils            = request.getAttribute( 'sitevision.utils' ),
        serviceUrl       = 'http://172.25.105.1:80/kobrahttp/kobrahttp.exe?function=KUTW760',
        mailUtil         = utils.getMailUtil(),
        logUtil          = utils.getLogUtil(),
        theMail,
        mailBuilder,
        xmlToSend,
        xmlResponse,
        jsonData,
        mailText;


    function getCart(){

        return '<?xml version="1.0" encoding="UTF-8"?><request><body><getCart><token>'+ token +'</token><firm>45</firm></getCart></body></request>';

    }

    function sendPOST( aXMLToSend ){

        var bufferedReader,
            stringBuilder,
            line,
            httpClient = new Packages.org.apache.commons.httpclient.HttpClient(),
            postMethod = new Packages.org.apache.commons.httpclient.methods.PostMethod( serviceUrl ),
            responseCode,
            responseInput;

        postMethod.setRequestBody( new Packages.java.io.ByteArrayInputStream( new Packages.java.lang.String( aXMLToSend ).getBytes() ) );
        responseCode = httpClient.executeMethod( postMethod );
        responseInput = postMethod.getResponseBodyAsStream();

        if ( responseCode === 200) {
            try {
                bufferedReader = new Packages.java.io.BufferedReader( new Packages.java.io.InputStreamReader( responseInput ) );
                stringBuilder = new Packages.java.lang.StringBuilder();

                while ( ( line = bufferedReader.readLine() ) !== null) {
                    stringBuilder.append(line);
                }

                postMethod.releaseConnection();

            } catch( e ) {
                logUtil.error( '[MAIL] Could not read xml response from "'+ serviceUrl +'": ' + e );
            }
        } else {
            out.println( '<div>Felkod från ' + serviceUrl + '</div>' );
        }

        return stringBuilder.toString();
    }

    function xmlToJSON( aXML ) {

        return Packages.org.json.XML.toJSONObject( aXML );
    }

    function renderItem( anItem, aStringBuilder ){

        var insurancePercentage = anItem.get( 'insurancePercentage' ),
            incurancePrice      = anItem.get( 'incurancePrice' ),
            description         = anItem.get( 'description' ),
            rentalCode          = anItem.get( 'rentalCode' ),
            fromDate            = anItem.get( 'fromDate' ),
            toDate              = anItem.get( 'toDate' ),
            amount              = anItem.get( 'amount' ),
            price               = anItem.get( 'price' ),
            days                = anItem.get( 'days' ),
            url                 = anItem.get( 'url' );

        aStringBuilder.append( '\n' ).append( amount ).append( ' st ' )
                      .append( description ).append( ' nr: ' )
                      .append( rentalCode ).append( '\n' );

        aStringBuilder.append( 'Från: ' ).append( fromDate )
                      .append( ' till: ' ).append( toDate )
                      .append( ' antal' ).append( ' dagar: ' )
                      .append( days ).append( '\n' );

        aStringBuilder.append( 'Pris: ' ).append( price ).append( ' st \n\n' );

    }

    function buildMailText( aJSON ) {

        var cart = aJSON.getJSONObject( 'response' )
                        .getJSONObject( 'body' )
                        .getJSONObject( 'getCart' )
                        .getJSONObject( 'cart' ),
            stringBuilder = new Packages.java.lang.StringBuilder(),
            isArray = true,
            jsonArray,
            item;

        try {

            jsonArray = cart.getJSONArray( 'item' );

        } catch ( e ) {

            isArray = false;

        }

        stringBuilder.append( 'Orderlista\n---------------------------' );
        if ( !isArray ) {

            item = cart.getJSONObject( 'item' );
            renderItem( item, stringBuilder );

        } else {

            for( var i = 0; i < jsonArray.length(); i++ ) {
                item = jsonArray.get( i );
                renderItem( item, stringBuilder );
            }
        }

        return stringBuilder.toString();
    }

    try {
        xmlToSend       = getCart();
        xmlResponse     = sendPOST( xmlToSend );
        jsonData        = xmlToJSON( xmlResponse );

    } catch ( e ) {

        logUtil.error( '[MAIL] Error: ' + e );
    }

    if ( token && !''.equals( token ) ) {

        mailText    = buildMailText( xmlToJSON( xmlResponse ) );
        mailBuilder = mailUtil.getMailBuilder();
        theMail     = mailBuilder.setSubject( 'Arento ordlista' )
                                 .clearRecipients()
                                 .setTextMessage( mailText )
                                 .addRecipient( 'anders.israelsson@bouvet.se' )
                                 .build();

        // theMail.send();


        out.println( '<p>Mail skickat</p>' + mailText );

    }

}() );