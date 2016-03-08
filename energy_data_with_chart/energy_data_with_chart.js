var CONFIG = {
   API_URL : "http://www.debatt.info/Debatt.WebService/API/GetAnlaggningForbrStat",
   KUND_ID_PARAM : "kundid",
   KUND_ID_VALUE : "00065",
   PASSWORD_PARAM : "password",
   PASSWORD_VALUE : "540101-8212",
   SSID_PARAM : "ssid",
   SSID_VALUE : "DEB1",
   ANLAGGNINGS_PARAM : "anlaggningid",
   ANLAGGNINGS_VALUE : "100740"
}

var utils = request.getAttribute("sitevision.utils");
var session = request.getAttribute("sitevision.jcr.session");
var propertyUtil = utils.getPropertyUtil();
var logUtil = utils.getLogUtil();

var mainDataMap = new Packages.java.util.TreeMap();  // HashMap(<String, HashMap<String, String>) e.x HashMap("2015", yearMap);
var yearMapBluePrint = new Packages.java.util.TreeMap();
function setYearMapBluePrint()
{
   yearMapBluePrint.put("00", "0");
   yearMapBluePrint.put("01", "0");
   yearMapBluePrint.put("02", "0");
   yearMapBluePrint.put("03", "0");
   yearMapBluePrint.put("04", "0");
   yearMapBluePrint.put("05", "0");
   yearMapBluePrint.put("06", "0");
   yearMapBluePrint.put("07", "0");
   yearMapBluePrint.put("08", "0");
   yearMapBluePrint.put("09", "0");
   yearMapBluePrint.put("10", "0");
   yearMapBluePrint.put("11", "0");
   yearMapBluePrint.put("12", "0");
}

var colorCodeMap = new Packages.java.util.HashMap();
function setColorHexCode()
{
   colorCodeMap.put("2016", "rgba(255, 0, 0, ");
   colorCodeMap.put("2015", "rgba(0, 255, 0, ");
   colorCodeMap.put("2014", "rgba(204, 0, 153, ");
   colorCodeMap.put("2013", "rgba(255, 153, 0, ");
   colorCodeMap.put("2012", "rgba(0, 102, 255, ");
}

function getdApiURL()
{
   var apiUrlBuilder = new Packages.java.lang.StringBuilder();
   apiUrlBuilder.append(CONFIG.API_URL)
                .append("?")
                .append(CONFIG.KUND_ID_PARAM).append("=").append(CONFIG.KUND_ID_VALUE)
                .append("&")
                .append(CONFIG.PASSWORD_PARAM).append("=").append(CONFIG.PASSWORD_VALUE)
                .append("&")
                .append(CONFIG.SSID_PARAM).append("=").append(CONFIG.SSID_VALUE)
                .append("&")
                .append(CONFIG.ANLAGGNINGS_PARAM).append("=").append(CONFIG.ANLAGGNINGS_VALUE);


   logUtil.error("API_URL: " + apiUrlBuilder.toString());
   return apiUrlBuilder.toString();
}

function makeConnection()
{
   var stringBuilder = new Packages.java.lang.StringBuilder();
   var apiConnection = new Packages.java.net.URL(getdApiURL());
   var urlConnection = apiConnection.openConnection();
   var bufferedReader = new Packages.java.io.BufferedReader(new Packages.java.io.InputStreamReader(urlConnection.getInputStream(), "UTF-8"));
   var inputLine = null;
   while ((inputLine = bufferedReader.readLine()) != null)
   {
      stringBuilder.append(inputLine);
   }
   bufferedReader.close();

   return stringBuilder.toString();
}

function createJSONObjects(anXmlAsString)
{
   var jsonParser = new Packages.org.json.simple.parser.JSONParser();
   var jsonObjs = jsonParser.parse(anXmlAsString);

   return jsonObjs;
}

function handleJsonArr(aJsonArr)
{
   for (var i = 0; i < aJsonArr.size(); i++)
   {
      var jsonObj = aJsonArr.get(i);
      var period = "" + jsonObj.get("Arperiod");
      var year = period.substring(0, 4);
      var month = period.substring(4, 6);

      var enerigForbrukning = "" + Packages.java.lang.Math.round((jsonObj.get("Flodeforbrukning") * 100));
      var doesYearExists = mainDataMap.get(year);
      if (doesYearExists == null)
      {
         var yearMap = yearMapBluePrint.clone();
         yearMap.put("00", year);
         yearMap.put(month, enerigForbrukning);
         mainDataMap.put(year, yearMap);
      } else
      {
         doesYearExists.put(month, enerigForbrukning);
      }
   }
}

function renderMonthlyData(anYear)
{
   var builder = new Packages.java.lang.StringBuilder();
   var subMap = mainDataMap.get(anYear);
   var subIT = subMap.keySet().iterator();
   while (subIT.hasNext())
   {
      var key = subIT.next();
      if ("00".equals(key))
         continue;

      var value = subMap.get(key);
      builder.append("" + value + ",");
   }

   return builder.toString();
}

function getColorHexCode(anYear)
{
   var value = colorCodeMap.get(anYear);
   if (value != null)
      return value;

   return "rgba(0, 0, 0, ";
}

function renderDataSet()
{
   var yearsIT = mainDataMap.keySet().iterator();
   while (yearsIT.hasNext())
   {
      var year = yearsIT.next();
      var color = getColorHexCode(year);
      out.println("        {");
      out.println("           label: \""+ year +"\",");
      out.println("           fillColor: \""+ color +"0.5)\",");
      out.println("           strokeColor: \""+ color +"0.8)\",");
      out.println("           highlightFill: \""+ color +"0.75)\",");
      out.println("           highlightStroke: \""+ color +"1)\",");
      out.println("           data: ["+ renderMonthlyData(year) +"]");
      out.println("       },");
   }

   return;
}

function renderScript()
{
   out.println("<script>");
   out.println("  var energyData = {");
   out.println("     labels: [\"Jan\", \"Feb\", \"Mar\", \"Apr\", \"Maj\", \"Jun\", \"Jul\", \"Aug\", \"Sep\", \"Okt\", \"Nov\", \"Dec\"],");
   out.println("     datasets: [");
   renderDataSet();
   out.println("     ]");
   out.println("  };");
   out.println("</script>");

   return;
}

function renderStats()
{
   var builder = new Packages.java.lang.StringBuilder();
   builder.append("<div style=\"width:86%;margin:0 auto;padding-left:4%;\" id=\"bvEnergyDetailStats\"></div>");
   var yearsIT = mainDataMap.keySet().iterator();
   while (yearsIT.hasNext())
   {
      var year = yearsIT.next();
      builder.append("<div style=\"margin:10px 0;\"><div style=\"width:40px;height:20px;background-color:"+ getColorHexCode(year) +"0.75);float:left;margin-right:10px;\"></div> "+ year +"</div>");
   }

   return builder.toString();
}

function renderMainPart()
{
   out.println("<div style=\"width:94% !important;margin:0 auto;\">");
   out.println("  <canvas id=\"bvEneergyChart\"></canvas>");
   renderScript();
   out.println("</div>");

   out.println(renderStats());
}

var xmlAsString = makeConnection();
var jsonArray = createJSONObjects(xmlAsString);
setYearMapBluePrint();
setColorHexCode();
handleJsonArr(jsonArray);
renderMainPart();

var dollar = "$";
