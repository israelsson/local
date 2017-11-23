/* globals Packages, request, out */

( function(){

    'use strict';

    var xmlBegining      = '<?xml version="1.0" encoding="UTF-8"?><request><body>',
        xmlEnd           = '</body></request>',
        servletRequest   = request.getServletRequest(),
        session          = servletRequest.getSession(),
        token            = session.getAttribute( 'kobra-token' ),
        utils            = request.getAttribute( 'sitevision.utils' ),
        logUtil          = utils.getLogUtil(),
        serviceUrl       = 'http://172.25.105.1:80/kobrahttp/kobrahttp.exe?function=KUTW760',
        tomorrowsDate,
        PARAMS     = {
            ADD:        'add',
            UPDATE:     'update',
            DELETE:     'delete',
            GET_CART:   'get',
            EMPTY:      'empty',
            GET_PAGE:   'getProductPage'
        };

    function debugNode( aNode ){
        var tFactory = Packages.javax.xml.transform.TransformerFactory.newInstance();
        var transformer = tFactory.newTransformer();

        var source = new Packages.javax.xml.transform.dom.DOMSource( aNode );
        var result = new Packages.javax.xml.transform.stream.StreamResult( out );
        out.println( transformer.transform(source, result) );
    }

    function getTomorrowsDate() {
        var now           = new Packages.java.util.Date(),
            calendar      = Packages.java.util.Calendar.getInstance(),
            dateFormatter = new Packages.java.text.SimpleDateFormat( 'yyyy-MM-dd' );

        calendar.setTime( now );
        calendar.add( Packages.java.util.Calendar.DATE, 1 );
        now = calendar.getTime();

        return dateFormatter.format( now );
    }

    function createXMLDoc( aXMLString ){

        var factory = Packages.javax.xml.parsers.DocumentBuilderFactory.newInstance(),
            builder,
            xmlDocument;

        try
        {
            builder = factory.newDocumentBuilder();
            xmlDocument = builder.parse( new Packages.org.xml.sax.InputSource( new Packages.java.io.StringReader( aXMLString ) ) );
        } catch ( e ) {

        }

        return xmlDocument;
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

                while ( ( line = bufferedReader.readLine() ) != null) {
                    stringBuilder.append(line);
                }

                postMethod.releaseConnection();

            } catch( e ) {
                logUtil.error( '[ORDERS BACKEND] Could not read xml response from "'+ serviceUrl +'": ' + e );
            }
        } else {
            out.println( '<div>Felkod från ' + serviceUrl + '</div>' );
        }

        return stringBuilder.toString();
    }

    function xmlToJSON( aXML ) {

        var xmlJSONObj = Packages.org.json.XML.toJSONObject( aXML ),
            jsonPrettyPrintString = xmlJSONObj.toString( 4 );

        return jsonPrettyPrintString;
    }

    function addItem( aRentalCode, anAmount, aFromDate, aToDate, anUrl ){
        //var xml = xmlBegining + '<addItem><token>'+ token +'</token><rentalCode>'+ aRentalCode +'</rentalCode><amount>'+ anAmount +'</amount><days>1</days><firm>45</firm></addItem>' + xmlEnd;
        var xmlDate = xmlBegining + '<addItem><token>'+ token +'</token><rentalCode>'+ aRentalCode +'</rentalCode><amount>'+ anAmount +'</amount><fromDate>'+ aFromDate +'</fromDate><toDate>'+ aToDate +'</toDate><url>'+ anUrl +'</url><firm>45</firm></addItem>' + xmlEnd;

        return xmlDate;
    }

    function updateItem( aRentalCode, anAmount, aFromDate, aToDate, anItemID ){
        //var xml = xmlBegining + '<updateItem><token>'+ token +'</token><rentalCode>'+ aRentalCode +'</rentalCode><amount>'+ anAmount +'</amount><days></days><firm>45</firm></updateItem>' + xmlEnd;
        var xmlDate = xmlBegining + '<updateItem><token>'+ token +'</token><rentalCode>'+ aRentalCode +'</rentalCode><itemID>'+ anItemID +'</itemID><amount>'+ anAmount +'</amount><fromDate>'+ aFromDate +'</fromDate><toDate>'+ aToDate +'</toDate><firm>45</firm></updateItem>' + xmlEnd;

        return xmlDate;
    }

    function deleteItem( aRentalCode, anItemId ){
        var xml = xmlBegining + '<deleteItem><token>'+ token +'</token><itemID>'+ anItemId +'</itemID><rentalCode>'+ aRentalCode +'</rentalCode><firm>45</firm></deleteItem>' + xmlEnd;

        return xml;
    }

    function getCart(){
        var xml = xmlBegining + '<getCart><token>'+ token +'</token><firm>45</firm></getCart>' + xmlEnd;
        return xml;
    }

    function emptyCart() {
        var xml = xmlBegining + '<emptyCart><token>' + token + '</token><firm>45</firm></emptyCart>' + xmlEnd;
        return xml;
    }

    function handleParam( aParameter ){
        var rentalCodeParam  = request.getParameter( 'artNo' ),
            rentalCodeParam2 = request.getParameter( 'rentalCode' ),
            amountParam      = ( request.getParameter( 'amount' ) && !''.equals( request.getParameter( 'amount' ) ) ? request.getParameter( 'amount' ) : '1' ),
            fromDateParam    = ( request.getParameter( 'fromDate' ) && !''.equals( request.getParameter( 'fromDate' ) ) ? request.getParameter( 'fromDate' ) : tomorrowsDate ),
            toDateParam      = ( request.getParameter( 'toDate' ) && !''.equals( request.getParameter( 'toDate' ) ) ? request.getParameter( 'toDate' ) : tomorrowsDate ),
            itemIDParam      = ( request.getParameter( 'itemID' ) && !''.equals( request.getParameter( 'itemID' ) ) ? request.getParameter( 'itemID' ) : '1' ),
            urlParam         = ( request.getParameter( 'url' ) && !''.equals( request.getParameter( 'url' ) ) ? request.getParameter( 'url' ) : '' ),
            xmlToSend,
            xmlResponse,
            xmlResponseDoc,
            success = false,
            message;

        if ( PARAMS.ADD.equals( aParameter ) ) {

            try {

                xmlToSend       = addItem( rentalCodeParam, amountParam, fromDateParam, toDateParam, urlParam );
                xmlResponse     = sendPOST( xmlToSend );
                xmlResponseDoc  = createXMLDoc( xmlResponse );
                //debugNode( xmlResponseDoc );

                try {
                    success = xmlResponseDoc.getElementsByTagName( 'message' ).item( 0 ).getTextContent();
                } catch( e ) {

                    try {
                        message = xmlResponseDoc.getElementsByTagName( 'errorMsg' ).item( 0 ).getTextContent();
                        logUtil.error( '[ORDERS BACKEND ADD] Could not add product to shopping cart, message: ' + message + ': ' + e );
                    } catch( e ) {
                        logUtil.error( '[ORDERS BACKEND ADD] Could not add product to shopping cart, NO message provided from external part: ' + e );
                    }
                }

            } catch ( e ) {

                logUtil.error( '[ORDERS BACKEND ADD] Error when adding product to shopping cart: ' + e );

            }

        } else if ( PARAMS.UPDATE.equals( aParameter ) ) {

            var field = request.getParameter( 'field' ),
                newValue;

            if ( field.equals( 'dateFrom' ) ) {

                newValue = request.getParameter( 'newValue' );
                xmlToSend = updateItem( rentalCodeParam2, amountParam, newValue, toDateParam, itemIDParam );
                out.println( xmlToSend );

            } else if ( field.equals( 'dateTo' ) ) {

                newValue = request.getParameter( 'newValue' );
                xmlToSend = updateItem( rentalCodeParam2, amountParam, fromDateParam, newValue, itemIDParam );
                out.println( xmlToSend );

            } else {

                xmlToSend = updateItem( rentalCodeParam2, amountParam, fromDateParam, toDateParam, itemIDParam );

            }

            xmlResponse     = sendPOST( xmlToSend );
            xmlResponseDoc  = createXMLDoc( xmlResponse );
            //debugNode( xmlResponseDoc );

            try {

                success = xmlResponseDoc.getElementsByTagName( 'message' ).item( 0 ).getTextContent();

            } catch ( e ) {

                try {

                    success = xmlResponseDoc.getElementsByTagName( 'errorMsg' ).item( 0 ).getTextContent();

                } catch ( e ) {

                    logUtil.error( '[ORDERS BACKEND UPDATE] Error when updating product to' +
                                   ' shopping, no error message provided: ' +
                                   ' cart: ' + e );
                }

                logUtil.error( '[ORDERS BACKEND UPDATE] Error when updating product to shopping' +
                               ' cart: ' + e );

            }

        } else if ( PARAMS.DELETE.equals( aParameter ) ) {

            try {
                xmlToSend       = deleteItem( rentalCodeParam2, itemIDParam );
                xmlResponse     = sendPOST( xmlToSend );
                xmlResponseDoc  = createXMLDoc( xmlResponse );

                success = xmlResponseDoc.getElementsByTagName( 'message' ).item( 0 ).getTextContent();

            } catch ( e ) {

                success = xmlResponseDoc.getElementsByTagName( 'errorMsg' ).item( 0 ).getTextContent();
                logUtil.error( '[ORDERS BACKEND DELETE] Could not delete product from cart: ' + e );
            }

        } else if ( PARAMS.GET_CART.equals( aParameter ) ) {

            try {
                xmlToSend       = getCart();
                xmlResponse     = sendPOST( xmlToSend );
                //xmlResponseDoc  = createXMLDoc( xmlResponse );

                success = true;

                return xmlToJSON( xmlResponse );

            } catch ( e ) {

                logUtil.error( '[ORDERS BACKEND GET] Could not get shopping cart: ' + e );

            }

        } else if ( PARAMS.EMPTY.equals( aParameter ) ) {

            try {
                xmlToSend       = emptyCart();
                xmlResponse     = sendPOST( xmlToSend );
                xmlResponseDoc  = createXMLDoc( xmlResponse );
                success = xmlResponseDoc.getElementsByTagName( 'message' ).item( 0 ).getTextContent();
                logUtil.info( '[ORDERS BACKEND EMPTY] Empty shopping cart: ' +  success );

            } catch ( e ) {

                try {
                    success = xmlResponseDoc.getElementsByTagName( 'errorMsg' ).item( 0 ).getTextContent();
                    logUtil.error( '[ORDERS BACKEND EMPTY] Empty shopping cart: ' +  success );
                } catch ( e ) {

                }

                logUtil.error( '[ORDERS BACKEND EMPTY] Could not empty cart: ' + e );
            }
        } else if ( PARAMS.GET_PAGE.equals( aParameter ) ){

            try {
                xmlToSend       = getCart();
                xmlResponse     = sendPOST( xmlToSend );
                //xmlResponseDoc  = createXMLDoc( xmlResponse );

                success = true;

                return xmlToJSON( xmlResponse );

            } catch ( e ) {

                logUtil.error( '[ORDERS BACKEND GET PAGE] Could not get shopping cart: ' + e );

            }
        }

        return success;
    }

    tomorrowsDate = getTomorrowsDate();
    out.println( handleParam( request.getParameter( 'action' ) ) );

}() );