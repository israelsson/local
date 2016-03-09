/*
 * @author: Anders Israelsson, Bouvet AB
 * @version: 1.0
 */

var CONFIG = {
   SEARCH_BASE: "dc=sitevision,dc=se",
   /* OU: "sub;sub2", */
   GROUP_CONTAINER: "702.2c5d3b8c14c98469003659"
}

var utils = sitevisionUtils;
var session = jcrSession;

var logUtil = utils.getLogUtil();
var directoryUtil = utils.getDirectoryUtil();
var propertyUtil = utils.getPropertyUtil();
var nodeTypeUtil = utils.getNodeTypeUtil();
var userIdentityUtil = utils.getUserFactory().getUserIdentityUtil();
var groupFactory = utils.getCollaborationFactory();

/*
 * Get all ou:s from allOUsForGroup and returns them as searchable ou:s
 */
function createOUSearchString(allOUsForGroup)
{
   var builder = new Packages.java.lang.StringBuilder();
   var ouArray = allOUsForGroup.split(";");

   for (var i = 0; i < ouArray.length; i++)
   {
      builder.append("|(ou=").append(ouArray[i]).append(")");
   }
   return builder.toString();
}

/*
 * Do the LDAP search and return the result as a list
 *
 * @deprecated
 *
 */
/*
function doLdapSearchAndGetResult()
{
   var resourceLocatorUtil = utils.getResourceLocatorUtil();
   var directoryNode = resourceLocatorUtil.getDirectoryRepository().getNodes().next();
   var searchResult = directoryUtil.search("(&(objectclass=*)("+ createOUSearchString() +"))", directoryNode, CONFIG.SEARCH_BASE);
   return searchResult;
}
*/

/*
 * Do the LDAP search and return the result as a list
 */
function doLdapSearchAndGetResult(theOUs)
{
   if (theOUs == null)
      return new Packages.java.util.ArrayList();

   var resourceLocatorUtil = utils.getResourceLocatorUtil();
   var directoryNode = resourceLocatorUtil.getDirectoryRepository().getNodes().next();
   var searchResult = directoryUtil.search("(&(objectclass=*)("+ createOUSearchString(theOUs) +"))", directoryNode, CONFIG.SEARCH_BASE);
   return searchResult;
}

/*
 * Lists only users in one OU
 */
function listUsersInOU(anOU)
{
   var ouChildren = anOU.getNodes();
   while (ouChildren.hasNext())
   {
      var ouChild = ouChildren.next();
      if (nodeTypeUtil.isUser(ouChild) || nodeTypeUtil.isUserIdentity(ouChild))
      {
         var ouChildDN = getStringValue(ouChild, "dn");
         //out.println("<p>"+ ouChild +" "+ ouChildDN +"</p>");
      }
   }
}

/*
 * Gets the social user from a regular user node
 */
function getSocialUser(anUserNode)
{
   return userIdentityUtil.getOrCreateUserIdentity(anUserNode);
}

/*
 * Get metadata value as string
 */
function getStringValue(aNode, aPropertyName)
{
   return propertyUtil.getString(aNode, aPropertyName, "");
}

/*
 * Gets metadata value as node
 */
function getNodeValue(aNode, aPropertyName)
{
   return propertyUtil.getNode(aNode, aPropertyName);
}

/*
 * Get all members from a group
 */
function getGroupMembers(aGroup)
{
   var membersSet = groupFactory.getCollaborationGroupWrapper(aGroup).getMembers();
   return membersSet;
}

/*
 * Get users from social user
 */
function getBackingUserSet(aSet)
{
   var tempIT = aSet.iterator();
   var tempSet = new Packages.java.util.HashSet();
   while (tempIT.hasNext())
   {
      var temp = tempIT.next();
      tempSet.add(getStringValue(getNodeValue(temp, "backingUser"), "dn"));
   }

   return tempSet;
}

function controlIfUserIsMember(aGroup, anOUNodeContainer)
{
   var groupMembers = getGroupMembers(aGroup);
   var groupMembersBackingUsers = getBackingUserSet(groupMembers);

   var ouChildren = anOUNodeContainer.getNodes();
   while (ouChildren.hasNext())
   {
      var ouChild = ouChildren.next();
      if (nodeTypeUtil.isUser(ouChild) || nodeTypeUtil.isUserIdentity(ouChild))
      {
         var ouChildDN = getStringValue(ouChild, "dn");
         if (!groupMembersBackingUsers.contains(ouChildDN))
         {
            logUtil.info("Adding user: "+ ouChildDN +" to group: "+ aGroup);
            groupFactory.getCollaborationGroupWrapper(aGroup).addMember(getSocialUser(ouChild));
         }
      }
   }
}

function handleGroups()
{
   logUtil.info("Starting social group update check...");
   var groupContainer = session.getNodeByIdentifier(CONFIG.GROUP_CONTAINER);
   var groups = groupContainer.getNodes();

   while (groups.hasNext())
   {
      var group = groups.next();
      if (nodeTypeUtil.isCollaborationGroupPage(group))
      {

         var metadataOUValueArr = propertyUtil.getStrings(group, "bvOUContainer");
         var metadataOUValue = "";

         for (var j = 0; j < metadataOUValueArr.size(); j++)
         {
            metadataOUValue += metadataOUValueArr.get(j) + ";";
         }

         var searchResult = doLdapSearchAndGetResult(metadataOUValue);
         for (var i = 0; i < searchResult.size(); i++)
         {
            var theOU = searchResult.get(i);
            if ("sv:userContainer".equals(theOU.getPrimaryNodeType()))
            {
               controlIfUserIsMember(group, theOU);
            }
         }
      }
   }
   logUtil.info("End social group update check...");
}

handleGroups();
