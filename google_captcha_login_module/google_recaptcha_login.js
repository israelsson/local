1. Registrera Google ReCaptcha på https://www.google.com/recaptcha/admin#list Där väljer man för vilka domäner den ska gälla för bl.a.

2. Länka in Google ReCaptchas skript i HEAD på sidan:
<script src="https://www.google.com/recaptcha/api.js"></script>

3. Lägg in följaden skript i en skriptmodul på inloggningssidan. Kom ihåg att ändra SECRET_KEY och SITE_KEY med det som fås i steg 1. Kom också ihåg att inloggningssidan ska vara publik.

JAVASCRIPT-delen:

var SECRET_KEY = "6LeYWRMTAAAAADmQbaOnp3nVEXTYC27w70MObaqv";
var SITE_KEY = "6LeYWRMTAAAAAA19CF0qXuLq5QCYfZ7IytIbFMmc";

var utils = request.getAttribute("sitevision.utils");
var authUtil = utils.getAuthenticationUtil();
var logUtil = utils.getLogUtil();
var showCaptcha = false;
var authSuccess = false;

if (request.getParameter("bvLoginSubmit") !== null)
{
	var namn = request.getParameter("bvNamn");
   var pass = request.getParameter("bvPass");
   var captchaParam = request.getParameter("g-recaptcha-response");
   
   if (captchaParam !== null && !"".equals(captchaParam))
   {
      var url = "https://www.google.com/recaptcha/api/siteverify?secret="+ SECRET_KEY +"&response=" +captchaParam;
      var obj = new Packages.java.net.URL(url);
      var conn = obj.openConnection();
      var responseCode = conn.getResponseCode();
      var inn = new Packages.java.io.BufferedReader(new Packages.java.io.InputStreamReader(conn.getInputStream()));
      var inputLine;
      var responset = new Packages.java.lang.StringBuffer();
 
      while ((inputLine = inn.readLine()) !== null)
      {
         responset.append(inputLine);
      }
      inn.close();                               
   }
   
   try
   {
      if (responset.toString().contains("true"))
      {
         authUtil.login(request, namn, pass);
         authSuccess = true;
      }
   } catch (e)
   {
      showCaptcha = true;
      logUtil.error("FEL: " + e);
   }
}


VELOCITY-delen:
<div class="bvNobinaLoginFilter">
   #if ($authSuccess)
      <script>
      
         window.location.href = "/";
      
      </script>
   #else
      <form action="" method="post">
         <div style="padding:1em 0;"><label style="width:15%;display:inline-block;" for="bvNamn">Användarnamn: </label><input type="text" name="bvNamn"></div>
         <div style="padding:1em 0;"><label style="width:15%;display:inline-block;" for="bvPass">Lösenord: </label><input type="password" name="bvPass"></div>
         <div style="padding:1em 0;"><input type="submit" name="bvLoginSubmit" value="Logga in"></div>
         #if ($showCaptcha)
         <div style="padding:1em 0;" class="g-recaptcha" data-sitekey="$SITE_KEY"></div>
         #end
      </form>
   #end
</div>


4. Testa lösningen..