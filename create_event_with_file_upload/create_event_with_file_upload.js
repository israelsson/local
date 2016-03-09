try {
 /*
* Bouvet Stockholm AB
*
* @author Anders Israelsson
*
*/

// CONFIG -------------------------------------------------
var SEND_MAIL_TO = "evenemang@nykvarn.se";
var CUSTOM_MESSAGE_PUBLISH = "Ditt evenemang har mottagits och publiceras efter att det har modererats.!";
var CUSTOM_MESSAGE_REVIEW = "Ditt evenemang har mottagits och kommer att publiceras efter att det har modererats.";
var FROM_ADDRESS = "kommun@nykvarn.se";
var ARCHIVE = "3.525c192f1446f485bff2036";
var TEMPLATE = "91.75178331144f9b1d7ff8e06d";
var IMAGE_CONTAINER = "19.33ccf562145ac94e9983686f";
var CREATE_ARTICLE_PARAM = "doCreateArticle";
var DATE_FORMAT = "yyyy-MM-dd HH:mm";
var EMAIL_PATTERN = "^[_A-Za-z0-9-]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$";
var METADATA_TITLE_ALTS = "evenemangstyp";
var EVENT_CATEGORI = new Packages.java.util.ArrayList();
EVENT_CATEGORI.add("För barn");
EVENT_CATEGORI.add("För ungdomar");
EVENT_CATEGORI.add("För vuxna");
EVENT_CATEGORI.add("För alla");
// END CONFIG ---------------------------------------------

var utils = request.getAttribute("sitevision.utils");
var session = request.getAttribute("sitevision.jcr.session");

var propertyUtil = utils.getPropertyUtil();
var articleUtil = utils.getArticleUtil();
var portletContextUtil = utils.getPortletContextUtil();
var resourceLocatorUtil = utils.getResourceLocatorUtil();
var permissionUtil = utils.getPermissionUtil();
var currentPage = portletContextUtil.getCurrentPage();
var currentPageURL = propertyUtil.getString(currentPage, "URL", "");
var hiddenClass = "visuallyhidden";
var titleParam = "", summaryParam = "", longSummaryParam = "", contentParam = "", startParam = "", endParam = "", categoriParam = "", urlParam = "", priceParam = "", textTitleParam = "";
var organizerParam = "", locationParam = "", coordinateParam = "", contactParam = "", phoneParam = "", mailParam = "", ticketParam = "", servingParam = "";
var yourNameParam = "", yourTeleParam = "", yourMailParam = "";
var imageParam;
var imageNameParam;

var servletRequest = request.getServletRequest();
var archiveAsNode = session.getNodeByIdentifier(ARCHIVE);
var templateAsNode = session.getNodeByIdentifier(TEMPLATE);
var imageContainerAsNode = session.getNodeByIdentifier(IMAGE_CONTAINER);
var sitePage = resourceLocatorUtil.getSitePage();
var metadataUtil = utils.getMetadataUtil();
var metadataDefintionUtil = utils.getMetadataDefinitionUtil();
var categoriDefinition = metadataDefintionUtil.getDefinition(templateAsNode, METADATA_TITLE_ALTS);
var titleAlts;
if (categoriDefinition != null)
  titleAlts = categoriDefinition.getNodes();
else
  titleAlts = new Packages.java.util.ArrayList();

// Helpers -------------------------------------------------
var errorMessage = null;
var markAccept = false;
var isImageAttatched = false;
var renderForm = true;
var submitMessage = "";
var renderLoginUser = false;
var dollar = "$";

function getParamValues()
{
  textTitleParam = controlParamValue("inputNewEventTextTitle");
  titleParam = controlParamValue("inputNewEventTitle");
  categoriParam = controlParamValue("inputNewEventCategori");
  summaryParam = controlParamValue("inputNewEventSummary");
  longSummaryParam = controlParamValue("inputNewEventLongSummary");
  startParam = controlParamValue("inputNewEventStartDate");
  endParam = controlParamValue("inputNewEventEndDate");
  priceParam = controlParamValue("inputNewEventPrice");
  organizerParam = controlParamValue("inputNewEventOrganizer");
  locationParam = controlParamValue("inputNewEventPlace");
  contactParam = controlParamValue("inputNewEventContact");
  phoneParam = controlParamValue("inputNewEventPhone");
  mailParam = controlParamValue("inputNewEventMail");
  urlParam = controlParamValue("inputNewEventURL");
  ticketParam = controlParamValue("inputNewEventTicket");
  servingParam = controlParamValue("inputNewEventServing");
  yourNameParam = controlParamValue("inputNewEventYourName");
  yourTeleParam = controlParamValue("inputNewEventYourTele");
  yourMailParam = controlParamValue("inputNewEventYourMail");
}

function controlParamValue(aParamName)
{
  if (request.getParameter(aParamName) != null)
     return request.getParameter(aParamName);

  return "";
}

function checkParams()
{
  textTitleParam = request.getParameter("inputNewEventTextTitle");
  if (isNullOrEmptyString(textTitleParam))
  {
     errorMessage = "Du måste ange en rubrik!";
     return false;
  }

  titleParam = request.getParameter("inputNewEventTitle");
  if (isNullOrEmptyString(titleParam))
  {
     errorMessage = "Du måste ange en kategori!";
     return false;
  }

  categoriParam = request.getParameter("inputNewEventCategori");
  if (isNullOrEmptyString(categoriParam))
  {
     errorMessage = "Du måste ange en målgrupp!";
     return false;
  }

  summaryParam = request.getParameter("inputNewEventSummary");
  longSummaryParam = request.getParameter("inputNewEventLongSummary");
  /*
  contentParam = request.getParameter("inputNewEventContent");
  if (isNullOrEmptyString(contentParam))
  {
     errorMessage = "Du måste ange en innehållstext!";
     return false;
  }
  */

  startParam = request.getParameter("inputNewEventStartDate");
  if (isNullOrEmptyString(startParam) && !isCorrectDateFormat(startParam))
  {
     errorMessage = "Du måste ange en korrekt starttidpunkt!";
     return false;
  }

  endParam = request.getParameter("inputNewEventEndDate");
  if (isNullOrEmptyString(endParam) && !isCorrectDateFormat(endParam))
  {
     errorMessage = "Du måste ange en korrekt sluttidpunkt!";
     return false;
  }

  if (isBadDateValues())
  {
     errorMessage = "Felaktiga datumformat! Se till att startdatum inte ligger tillbaka i tiden samt att slutdatum inte är före startdatumet.";
     return false;
  }

  priceParam = request.getParameter("inputNewEventPrice");

  organizerParam = request.getParameter("inputNewEventOrganizer");
  if (isNullOrEmptyString(organizerParam))
  {
     errorMessage = "Du måste ange en arrangör!";
     return false;
  }

  locationParam = request.getParameter("inputNewEventPlace");
  if (isNullOrEmptyString(locationParam))
  {
     errorMessage = "Du måste ange en plats!";
     return false;
  }

  coordinateParam = request.getParameter("inputNewEventCoordinate");
  /*
  contactParam = request.getParameter("inputNewEventContact");
  if (isNullOrEmptyString(contactParam))
  {
     errorMessage = "Du måste ange en kontaktperson!";
     return false;
  }

  phoneParam = request.getParameter("inputNewEventPhone");
  if (isNullOrEmptyString(phoneParam))
  {
     errorMessage = "Du måste ange ett telefonnummer!";
     return false;
  }

  mailParam = request.getParameter("inputNewEventMail");
  if (isNullOrEmptyString(mailParam))
  {
     errorMessage = "Du måste ange en e-postadress!";
     return false;
  }

  if (!isEmailCorrect(mailParam))
  {
     errorMessage = "E-postadress har inte korrekt format! Ex. example@example.se";
     return false;
  }
  */

  yourNameParam = request.getParameter("inputNewEventYourName");
  if (isNullOrEmptyString(yourNameParam))
  {
     errorMessage = "Du måste ange ditt namn!";
     return false;
  }

  yourTeleParam = request.getParameter("inputNewEventYourTele");
  if (isNullOrEmptyString(yourTeleParam))
  {
     errorMessage = "Du måste ange ditt telefonnummer!";
     return false;
  }

  yourMailParam = request.getParameter("inputNewEventYourMail");
  if (isNullOrEmptyString(yourMailParam))
  {
     errorMessage = "Du måste ange din e-postadress!";
     return false;
  }

  if (!isEmailCorrect(yourMailParam))
  {
     errorMessage = "E-postadress har inte korrekt format! Ex. example@example.se";
     return false;
  }
  urlParam = request.getParameter("inputNewEventURL");

  ticketParam = request.getParameter("inputNewEventTicket");
  servingParam = request.getParameter("inputNewEventServing");

  imageParam = servletRequest.getAttribute("inputNewEventImage");
  if (imageParam != null && !imageParam.equals(""))
  {
     isImageAttatched = true;
     imageNameParam = servletRequest.getAttribute("inputNewEventImage.name");
  }

  acceptParam = request.getParameter("inputNewEventAccept");
  if (acceptParam == null || !acceptParam.equals("accept"))
  {
     errorMessage = "Du måste godkänna villkoren!";
     markAccept = true;
     return false;
  }

  return true;
}

function isNullOrEmptyString(aParam)
{
  if (aParam == null || aParam.equals(""))
     return true;

  return false;
}

function isBadDateValues()
{
  var sdf = new Packages.java.text.SimpleDateFormat(DATE_FORMAT);
  sdf.setLenient(false);

  try
  {
     var nowDate = new Packages.java.util.Date();
     var beginingDate = sdf.parse(startParam);
     var endingDate = sdf.parse(endParam);

     if (endingDate.before(beginingDate))
        return true;

     if (beginingDate.before(nowDate))
        return true;

  } catch(e)
  {
     return true;
  }

  return false;
}

function isEmailCorrect(anEmail)
{
  var pattern = Packages.java.util.regex.Pattern.compile(EMAIL_PATTERN);
  var matcher = pattern.matcher(anEmail);
  return matcher.matches();
}

function isCorrectDateFormat(aDate)
{
  var sdf = new Packages.java.text.SimpleDateFormat(DATE_FORMAT);
  sdf.setLenient(false);

  try
  {
     var date = sdf.parse(dateToValidate);
  } catch(e)
  {
     return false;
  }

  return true;
}

function parseToMillis(aDateAsString)
{
  var sdf = new Packages.java.text.SimpleDateFormat(DATE_FORMAT);
  sdf.setLenient(false);

  try
  {
     var date = sdf.parse(aDateAsString);
     return date.getTime();
  } catch(e)
  {

  }

  return null;
}

/*
* Method for sending mail
*/
function generateAndSendMail(aCreatedArticleID)
{
  var mailUtil = utils.getMailUtil();
  var mailBuilder = mailUtil.getMailBuilder();
  var mailMessage = "Nytt evenemang att godkänna på url: http://www.nykvarn.se/editor/index.jsp?objectId=" + aCreatedArticleID;
  var theMail = mailBuilder.setFrom(FROM_ADDRESS).setSubject("Nytt evenemang").setTextMessage(mailMessage).addRecipient(SEND_MAIL_TO).addReplyTo(mailParam).build();

  return theMail.send();

}

// End helpers ----------------------------------------------

var currentUser = portletContextUtil.getCurrentUser();
if (permissionUtil.hasPublishPermission(archiveAsNode, currentUser))
{
  renderLoginUser = false;
} else
{
  renderLoginUser = true;
}

if (request.getParameter(CREATE_ARTICLE_PARAM) != null && request.getParameter(CREATE_ARTICLE_PARAM).equals("doIt"))
{
  getParamValues();

  if (checkParams())
  {
     var uploadedImage = null;
     // 'Upload' possible image
     if(isImageAttatched)
     {
        var imageUtil = utils.getImageUtil();
        uploadedImage = imageUtil.createImage(imageContainerAsNode, imageNameParam, imageParam.toURI());

     }

     // Create article
     var contentMap = new Packages.java.util.HashMap();
     var sammanfattningColumnPortlets = "<div><a name=\"Rubrik\" /><h1 class=\"\">" + textTitleParam + "</h1></div>" +
           "<div><a name=\"Ingress\" /><p class=\"ingress\">" + (summaryParam.equals("") ? "<span style=\"display:none;\">&nbsp;</span>" : summaryParam) + " </p></div>" +
           "<div><a name=\"Innehåll\" /><p class=\"normal\">" + (longSummaryParam.equals("") ? "<span style=\"display:none;\">&nbsp;</span>" : longSummaryParam.replaceAll("\r", "\n").replaceAll("\n\n", "\n").replaceAll("\n", "<br/>")) + " </p></div>";

     if (isImageAttatched && uploadedImage != null)
     {
        //sammanfattningColumnPortlets += "<div><a name=\"Bild\" /><img src=\"" + propertyUtil.getString(uploadedImage, "URL", "") + "\" alt=\"\" /></div>";
        sammanfattningColumnPortlets += "<div><a name=\"Bild\" /><img src=\"/Evenemang/Uppladdat/" + imageNameParam + "\" alt=\"\" /></div>";
     }

     var mittenspaltColumnPortlets = "<div><a name=\"Plats\" /><p class=\"normal\"><strong>Var:</strong><br />" + locationParam + "</p></div>" +
           "<div><a name=\"Kostnad\" /><p class=\"normal\"><strong>" + (!priceParam.equals("") ? "Kostnad: " : "") + "</strong><br />" + priceParam + "</p></div>";

     var hogerspaltColumnPortlets = "<div><a name=\"Arrangör\" /><p class=\"normal\"><strong>Arrangeras av:</strong><br />" + organizerParam + "</p></div>" +
           "<div><a name=\"Hemsida\" /><p class=\"normal\"><strong>" + (!urlParam.equals("") ? "Hemsida: " : "" ) + "</strong><br />" + urlParam + "</p></div>";

           if (contactParam != null && !contactParam.equals(""))
              hogerspaltColumnPortlets = hogerspaltColumnPortlets + "<div><a name=\"Kontakt\" /><p class=\"normal\"><strong>Kontakt:</strong><br />" + contactParam + "<br />" + phoneParam + "<br />" + mailParam + "</p></div>";

           hogerspaltColumnPortlets = hogerspaltColumnPortlets + "<div><a name=\"Biljetter\" /><p class=\"normal\"><strong>" + (!ticketParam.equals("") ? "Biljettförsäljning: " : "") + "</strong><br />" + ticketParam + "</div>" +
           "<div><a name=\"Servering\" /><p class=\"normal\"><strong>" + (!servingParam.equals("") ? "Servering: " : "") + "</strong><br />" + servingParam + "</div>";

     contentMap.put("Sammanfattning", sammanfattningColumnPortlets);
     contentMap.put("Mittenspalt", mittenspaltColumnPortlets);
     contentMap.put("Högerspalt", hogerspaltColumnPortlets);

     var createdArticle = articleUtil.createArticle(archiveAsNode, templateAsNode, textTitleParam, null, contentMap);

     try
     {
        metadataUtil.setMetadataPropertyValue(createdArticle, "evenemangsmalgrupp", categoriParam);
        metadataUtil.setMetadataPropertyValue(createdArticle, "evenemangstyp", titleParam);
        metadataUtil.setMetadataPropertyValue(createdArticle, "startDate", parseToMillis(startParam));
        metadataUtil.setMetadataPropertyValue(createdArticle, "endDate", parseToMillis(endParam));

        metadataUtil.setMetadataPropertyValue(createdArticle, "reporterName", yourNameParam);
        metadataUtil.setMetadataPropertyValue(createdArticle, "reporterTele", yourTeleParam);
        metadataUtil.setMetadataPropertyValue(createdArticle, "reporterMail", yourMailParam);
     } catch(e)
     {
        out.println("" + e.javaException);
     }
     renderForm = false;
     if (permissionUtil.hasPublishPermission(archiveAsNode, currentUser))
     {
        // Publish the event - The event will publish now and unpublish at the end date
        var publishingUtil = utils.getPublishingUtil();
        var publishDate = new Packages.java.util.Date();
        var unpublishDate = new Packages.java.util.Date(parseToMillis(endParam));
        publishingUtil.publishNode(createdArticle, publishDate, unpublishDate);
        submitMessage = CUSTOM_MESSAGE_PUBLISH;

     } else
     {
        // Send mail for accepting event
        if (generateAndSendMail(createdArticle.getIdentifier()))
        {
           submitMessage = CUSTOM_MESSAGE_REVIEW;
        } else
        {
           submitMessage = "Något gick fel. Vänligen kontakta: <a href=\"" + FORM_ADDRESS + "\" title=\"\">" + FROM_ADDRESS + "</a>";
        }
     }
  }
}
} catch (e) {
   out.println("" + e.javaException);
}



#if ($renderForm)
<div class="bouvetStyle bouvetCreateEventContainer" style="padding:0">
   <form enctype="multipart/form-data" class="ui-widget ui-state-default ui-corner-all ui-button-text-only bouvetCreateEventForm" action="$currentPageURL" method="post" name="createNewArticle">
      #if ($errorMessage) <div class="ui-widget"><div style="padding:1em" class="ui-state-error ui-corner-all"><span class="ui-icon-alert">$errorMessage</span></div></div>  #end

      <fieldset>
      <legend>Evenemang:</legend>
      <div class="bouvetCreateEventDiv"><label class="bouvetCreateEventLabels" for="inputNewEventTextTitle">Rubrik:<sup style="color:#C00000;">*</sup></label><input class="ui-corner-all bouvetCreateEventInput" placeholder="Rubrik" name="inputNewEventTextTitle" id="inputNewEventTextTitle" value="$textTitleParam" /></div>
      <div style="$divStyle">
         <label class="bouvetCreateEventLabels" for="inputNewEventTitle">Kategori:<sup style="color:#C00000;">*</sup></label>
         <select class="ui-corner-all bouvetCreateEventInput" name="inputNewEventTitle" id="inputNewEventTitle">
            <option value="">Välj kategori</option>
            #foreach ($titleAlt in $titleAlts)
               <option #if ($titleAlt.toString().equals($titleParam)) selected="selected" #end value="$titleAlt">$titleAlt</option>
            #end
         </select>
      </div>

      <div class="bouvetCreateEventDiv">
         <label class="bouvetCreateEventLabels" for="inputNewEventCategori">Målgrupp:<sup style="color:#C00000;">*</sup></label>
         <select class="ui-corner-all bouvetCreateEventInput" name="inputNewEventCategori" id="inputNewEventCategori">
            <option value="">Välj målgrupp</option>
            #foreach ($eventType in $EVENT_CATEGORI)
               <option #if ($eventType.equals($categoriParam)) selected="selected" #end value="$eventType">$eventType</option>
            #end
         </select>
      </div>

      <div class="bouvetCreateEventDiv"><label class="bouvetCreateEventLabels" for="inputNewEventSummary">Kort beskrivning:</label><textarea class="ui-corner-all bouvetCreateEventInput" placeholder="Kort beskrivning av evenemanget (ingress)" name="inputNewEventSummary" id="inputNewEventSummary">$summaryParam</textarea></div>
      <div class="bouvetCreateEventDiv"><label class="bouvetCreateEventLabels" for="inputNewEventLongSummary">Utförlig beskrivning:</label><textarea class="ui-corner-all bouvetCreateEventInput" placeholder="Utförlig beskrivning" name="inputNewEventLongSummary" id="inputNewEventLongSummary" style="height: 6em;">$longSummaryParam</textarea></div>
      <div class="bouvetCreateEventDiv"><label class="bouvetCreateEventLabels" for="inputNewEventStartDate">Start:<sup style="color:#C00000;">*</sup></label><input class="bouvetTimePicker ui-corner-all bouvetCreateEventInput" type="text" placeholder="åååå-mm-dd tt:mm" value="$startParam" name="inputNewEventStartDate" id="inputNewEventStartDate" /></div>
      <div class="bouvetCreateEventDiv"><label class="bouvetCreateEventLabels" for="inputNewEventEndDate">Slut:<sup style="color:#C00000;">*</sup></label><input class="bouvetTimePicker ui-corner-all bouvetCreateEventInput" type="text" placeholder="åååå-mm-dd tt:mm" value="$endParam" name="inputNewEventEndDate" id="inputNewEventEndDate" /></div>
      <div class="bouvetCreateEventDiv"><label class="bouvetCreateEventLabels" for="inputNewEventPlace">Plats:<sup style="color:#C00000;">*</sup></label><input type="text" class="ui-corner-all bouvetCreateEventInput" placeholder="Plats" value="$locationParam" name="inputNewEventPlace" id="inputNewEventPlace" /></div>
      <div class="bouvetCreateEventDiv"><label class="bouvetCreateEventLabels" for="inputNewEventPrice">Pris:</label><input type="text" class="ui-corner-all bouvetCreateEventInput" placeholder="Pris" value="$priceParam" name="inputNewEventPrice" id="inputNewEventPrice" /></div>
      <div class="bouvetCreateEventDiv"><label class="bouvetCreateEventLabels" for="inputNewEventTicket">Biljettförsäljning:</label><input class="ui-corner-all bouvetCreateEventInput" type="text" placeholder="Biljettförsäljning" value="$ticketParam" name="inputNewEventTicket" id="inputNewEventTicket" /></div>
      <div class="bouvetCreateEventDiv"><label class="bouvetCreateEventLabels" for="inputNewEventServing">Servering:</label><input class="ui-corner-all bouvetCreateEventInput" type="text" placeholder="Servering" value="$servingParam" name="inputNewEventServing" id="inputNewEventServing" /></div>
      <div class="bouvetCreateEventDiv $hiddenClass"><label class="bouvetCreateEventLabels" for="inputNewEventImage">Bifoga bild:</label><input class="ui-corner-all bouvetCreateEventInput" type="file" name="inputNewEventImage" id="inputNewEventImage" /></div>
      </fieldset>

      <fieldset style="margin:2em 0;"><legend>Arrangör:</legend>
      <div class="bouvetCreateEventDiv"><label class="bouvetCreateEventLabels" for="inputNewEventYourName">Anmälarens namn:<sup style="color:#C00000;">*</sup></label><input class="ui-corner-all bouvetCreateEventInput" type="text" placeholder="Anmälarens namn" value="$yourNameParam" name="inputNewEventYourName" id="inputNewEventYourName" /></div>
      <div class="bouvetCreateEventDiv"><label class="bouvetCreateEventLabels" for="inputNewEventYourTele">Anmälarens telefonnr:<sup style="color:#C00000;">*</sup></label><input class="ui-corner-all bouvetCreateEventInput" type="text" placeholder="Anmälarens telefonnummer" value="$yourTeleParam" name="inputNewEventYourTele" id="inputNewEventYourTele" /></div>
      <div class="bouvetCreateEventDiv"><label class="bouvetCreateEventLabels" for="inputNewEventYourMail">Anmälarens e-post:<sup style="color:#C00000;">*</sup></label><input class="ui-corner-all bouvetCreateEventInput" type="text" placeholder="Anmälarens e-post" value="$yourMailParam" name="inputNewEventYourMail" id="inputNewEventYourMail" /></div>
      <div class="bouvetCreateEventDiv"><label class="bouvetCreateEventLabels" for="inputNewEventOrganizer">Arrangör:<sup style="color:#C00000;">*</sup></label><input class="ui-corner-all bouvetCreateEventInput" type="text" placeholder="Arrangör" value="$organizerParam" name="inputNewEventOrganizer" id="inputNewEventOrganizer" /></div>
      <div class="bouvetCreateEventDiv"><label class="bouvetCreateEventLabels" for="inputNewEventURL">Hemsida:</label><input class="ui-corner-all bouvetCreateEventInput" type="text" placeholder="www.example.com" value="$urlParam" name="inputNewEventURL" id="inputNewEventURL" /></div>
      <div class="bouvetCreateEventDiv"><label class="bouvetCreateEventLabels" for="inputNewEventContact">Kontaktperson:</label><input class="ui-corner-all bouvetCreateEventInput" type="text" placeholder="Kontaktperson" value="$contactParam" name="inputNewEventContact" id="inputNewEventContact" /></div>
      <div class="bouvetCreateEventDiv"><label class="bouvetCreateEventLabels" for="inputNewEventPhone">Telefonnummer:</label><input class="ui-corner-all bouvetCreateEventInput" type="text" placeholder="Telefonnummer" value="$phoneParam" name="inputNewEventPhone" id="inputNewEventPhone" /></div>
      <div class="bouvetCreateEventDiv"><label class="bouvetCreateEventLabels" for="inputNewEventMail">E-post:</label><input class="ui-corner-all bouvetCreateEventInput" type="text" placeholder="E-post" value="$mailParam" name="inputNewEventMail" id="inputNewEventMail" /></div>
      #if ($renderLoginUser)
         <input style="display:none;" type="text" name="name" id="name" value="event" />
         <input style="display:none;" type="text" name="pwd" id="pwd" value="event" />

      #end
      </fieldset>
      <input type="hidden" name="doCreateArticle" value="doIt" />
      <div class="ui-widget">
      <p class="bluexlink">Ett evenemang är ett nöje, enbart öppettider är inte ett evenemang, samhällsinformation som kan nyttjas av allmänheten kan godkännas.</p><p class="bluexlink">Nykvarns kommun förbehåller sig rätten att ändra och ta bort evenemang. Evenemanget modereras innan de publiceras.</p>
      <div style="padding:1em" #if($markAccept) class="ui-state-error ui-corner-all bouvetCreateEventDiv" #end><label style="" for="inputNewEventAccept">Jag godkänner villkoren:<sup style="color:#C00000;">*</sup></label><input type="checkbox" name="inputNewEventAccept" id="inputNewEventAccept" value="accept" /></div>
      </div>
      <input type="submit" value="Skicka in" name="inputNewEventSubmit" />
   </form>

   <script type="text/javascript">

   $(function() {
      $(".bouvetTimePicker").datetimepicker({
         controlType: 'select'
      });
      $("#ui-datepicker-div").wrap('<div class="bouvetStyle" />');
   });

   </script>
</div>
#else
   <p>$submitMessage</p>
#end
