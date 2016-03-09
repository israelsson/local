/*
 * Bouvet Stockholm AB
 *
 * @author Anders Israelsson
 */

// CONFIG ---------------------------------
var COORDINATE_ARCHIVE = "3.75178331144f9b1d7fff490";
var BACKEND_URL = "4.535f453b144f9c99a83ef98/12.535f453b144f9c99a83efa0.portlet";
var MAP_ICON_CONTAINER = "19.75178331144f9b1d7fff53d";
// Match those variables to the name of metadata definition
var COORDINATE_METADATA_NAME = "name";//"metadata.koordinatbeskrivning";
var COORDINATE_METADATA_DESC = "metadata.koordinatbeskrivning";
var COORDINATE_METADATA_LATITUD = "metadata.koordinatlatitud";
var COORDINATE_METADATA_LONGITUD = "metadata.koordinatlongitud";
//var COORDINATE_METADATA_TYPE = "metadata.kartKategorier";
var COORDINATE_METADATA_TYPE = "metadata.objektKategorier";
var COORDINATE_METADATA_URL = "metadata.koordinatURL";
// END CONFIG -----------------------------

// UTILS ----------------------------------
var utils = request.getAttribute("sitevision.utils");
var session = request.getAttribute("sitevision.jcr.session");
var propertyUtil = utils.getPropertyUtil();
var searchUtil = utils.getSearchUtil();
var portletContextUtil = utils.getPortletContextUtil();
var logUtil = utils.getLogUtil();
var currentPage = portletContextUtil.getCurrentPage();
// ----------------------------------------
var dollar = '$';
var searchResult = null;
var doSearchListing = false;
var mapIcons = null;

var availableCategories = propertyUtil.getStrings(currentPage, "kartKategorier");

function doSearch()
{
   //Old searchresult for search only in the mapobject archive
   //searchResult = searchUtil.search(" +path:" + COORDINATE_ARCHIVE + " +metadata.kartKategorier:*", null, 0, 100);

   //new sitewide search of all objects with latitude and longitude defined
   searchResult = searchUtil.search("+metadata.koordinatlatitud:?* +metadata.koordinatlongitud:?*", null, 0, 100);

   if (logUtil.isDebugEnabled())
      logUtil.debug("Initial search done... Hits: " + searchResult.getApproximateCount());

   if (searchResult != null && searchResult.getStatus() == searchResult.STATUS_OK)
   {
      doSearchListing = true;
   } else
   {
      logUtil.error("Map type search failed...");
   }

   mapIcons = session.getNodeByIdentifier(MAP_ICON_CONTAINER).getNodes();
}

doSearch();


<div style="margin: 0; position:relative;" id="mapTypeSetting">
<form name="mapSettingForm" id="mapSettingForm" style="position:absolute;top:2em;right:0;z-index:999;background-color:#f2f2f2;padding:1em" action="#" method="post">
<fieldset style="border:0;">
<legend style="font-weight:bold;margin-bottom:1em">Filtreringsalternativ</legend>
#foreach ($alt in $availableCategories)
   #set ($escapedAlt = $alt.replace(' ', ''))
   <div class="filterOption"><input type="checkbox" id="mapTyp$escapedAlt" value="$alt" style="width: 18px; height: 18px; vertical-align: bottom"><label for="mapTyp$escapedAlt">$alt</label></div>
#end
</fieldset>
   <!--<button type="button" id="clearAllFilter">Rensa filtrering</button>-->
</form>
</div>

<div id="bouvetMapObjectContainer">
<script type="text/javascript">
var locations = [
            #foreach($hit in $searchResult.getHits())
               #set ($hitName = $hit.getField("$COORDINATE_METADATA_NAME"))
               #set ($hitLat = $hit.getField("$COORDINATE_METADATA_LATITUD"))
               #set ($hitLong = $hit.getField("$COORDINATE_METADATA_LONGITUD"))
               #set ($hitType = $hit.getField("$COORDINATE_METADATA_TYPE"))
               #set ($hitUrl = "")
               #set ($hitUrl = $hit.getField("$COORDINATE_METADATA_URL"))
               #if (!$hitUrl || $hitUrl == "")
                  #set ($hitUrl = $hit.getField("uri"))
               #end
               #set ($hitSummary = $hit.getField("$COORDINATE_METADATA_DESC", ""))
               ["$hitName", "$hitLat", "$hitLong", "$hitType", "$hitUrl", "${hitSummary.replaceAll('"', '')}"], //$hit.getField("id")
            #end
];

#if ($mapIcons)
   var iconsMap = {};
   #foreach ($icon in $mapIcons)
      iconsMap["$propertyUtil.getString($icon, 'displayName')"] = "$propertyUtil.getString($icon, 'URI')";
   #end
#end

</script>
</div>


<div id="bouvetNykvarnMap">

</div>
<script type="text/javascript">
## AJAX SCRIPT FOR FILTERING
${dollar}(function() {

   ${dollar}("#mapTypeSetting #clearAllFilter").click(function(){
      ${dollar}("#mapTypeSetting input:checked").each(function() {
         ${dollar}svjq(this).attr("checked", false);
      });

      ${dollar}.get("$BACKEND_URL", function(data){
         ${dollar}("#bouvetMapObjectContainer").html(data);
      });
   });

   ${dollar}("#mapTypeSetting input").click(function(){

      var myCheckboxes = new Array();
      ${dollar}("#mapTypeSetting input:checked").each(function() {
         myCheckboxes.push(${dollar}svjq(this).val());
      });

      var escapedURL = encodeURI("$BACKEND_URL?karta=" + myCheckboxes);
      ${dollar}.get(escapedURL, function(data){
         ${dollar}("#bouvetMapObjectContainer").html(data);
      });
   })
});

var markers = new Array();
var markersInfo = new Array();

function setMarkers(map, locations) {
   for (var i = 0; i < locations.length; i++) {
      try {
         var location = locations[i];
         var myLatLng = new google.maps.LatLng(location[1], location[2]);
         var markerIcon = getMarkerIcon(location[3]);

         var marker = new google.maps.Marker({
            position: myLatLng,
            map: map,
            title: location[0],
            icon: markerIcon,
            infoWindowIndex : i,
            url: location[4],
            content: location[5],
         });

         var contentAsHTML = '<div id="content"><div id="coordinateInfoHeader"><h3>' + marker.title + '</h3></div><div id="coordinateInfoBody">' + marker.content + '<br /><br />GPS-position: Lat ' + myLatLng.lat().toFixed(6) + ' Long ' + myLatLng.lng().toFixed(6) + '</div><div id="coordinateInfoFooter"><br /><br /><a title="Mer info" href="' + marker.url + '">Mer info</a></div></div>';
         var infowindow = new google.maps.InfoWindow({
            maxWidth: 360,
            content: contentAsHTML
         });

         google.maps.event.addListener(marker, 'click', function(event){
            markersInfo[this.infoWindowIndex].open(map, this);
         });

         markers.push(marker);
         markersInfo.push(infowindow);
      } catch(e)
      {}

   }
}

function clearAllMarkers() {
  for (var i = 0; i < markers.length; i++ ) {
    markers[i].setMap(null);
  }
  markers.length = 0;
}

function clearAllMarkersInfo() {
  for (var i = 0; i < markersInfo.length; i++ ) {
    markersInfo[i] == null;
  }
  markersInfo.length = 0;
}

var mapOptions = {
   zoom: 13,
   center: new google.maps.LatLng(59.177521, 17.432484),
   mapTypeControlOptions: {
      mapTypeIds: [google.maps.MapTypeId.ROADMAP]
    },
    streetViewControl: false,
}

function getMarkerIcon(aCoordinateType)
{
   var imgName = aCoordinateType + ".png";
   var mapIcon = iconsMap[imgName];
   if (mapIcon != null)
      return mapIcon;

   return iconsMap["Default.png"];
}

var map = null;

${dollar}(function() {

   ${dollar}("#bouvetNykvarnMap").width("100%").height("550px").gmap3({
      map: {options: mapOptions}
   });

      map = ${dollar}("#bouvetNykvarnMap").gmap3("get");;
   setMarkers(map, locations);
   google.maps.event.addListener(map, 'zoom_changed', function(event){
         mapOptions.zoom = map.getZoom();
   });
   ${dollar}("#mapTypeSetting .filterOption").each(function(){
      var _checkbox = ${dollar}(this).find("input").eq(0)
      var _type = _checkbox.val();
      ${dollar}(this).prepend('<img src="' + getMarkerIcon(_type) + '" alt="" style="width: 22px; height: 22px; vertical-align:middle;" />');

   });
});
</script>
