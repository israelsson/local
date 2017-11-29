var REQUIRED = {
        budget: ['id', 'Period', 'Beskrivning', 'Prognos', 'Utfall', 'Budget'],
        information: ['start', 'end', 'type', 'process', 'budget', 'description', 'status'],
        timeline: ['Ansvarig', 'Beskrivning', 'Förfallodag', 'Startdag', 'Typ', 'id']
    },
    TEMPLATE_TEMPLATE = '91.7e1cb7cf15284d4fa62d94b2',
    ARCHIVE_TEMPLATE = '3.7e1cb7cf15284d4fa62d90e5',
    TEMPLATE = '701.1fe9ec9214daf4a1049a69ca',
    PROJECTS_FOLDER = '702.1fe9ec9214daf4a1049a6871',
    ARCHIVE_PROJECT = '3.1fe9ec9214daf4a1049a6866',
    TEMPLATE_PROJECT = '91.1fe9ec9214daf4a1049a7356',
    UNPUBLISHED_PROJECTS = '702.2d33d06515fe53668fec4d2f',

    /* Libraries */
    utils = request.getAttribute("sitevision.utils"),
    session = request.getAttribute('sitevision.jcr.session'),

    /* Utilities */
    propertyUtil            = utils.getPropertyUtil(),
    logUtil                 = utils.getLogUtil(),
    portletContextUtil      = utils.getPortletContextUtil(),
    publishingUtil          = utils.getPublishingUtil(),
    metadataUtil            = utils.getMetadataUtil(),
    metadataDefinitionUtil  = utils.getMetadataDefinitionUtil(),
    archiveUtil             = utils.getArchiveUtil(),
    articleUtil             = utils.getArticleUtil(),
    resourceLocatorUtil     = utils.getResourceLocatorUtil(),
    fileUtil                = utils.getFileUtil(),
    directoryUtil           = utils.getDirectoryUtil(),
    permissionUtil          = utils.getPermissionUtil(),
    trashcanUtil            = utils.getTrashcanUtil(),
    structureUtil           = utils.getStructureUtil(),

    currentPage = portletContextUtil.getCurrentPage();

function append(orig, data) {
    var appended = false;

    orig = orig || [];

    for (i = 0, len = orig.length; i < len; ++i) {
        if (orig[i].id === data.id) {
            orig[i] = data;

            appended = true;
        }
    }

    if (!appended) orig.push(data);

    return orig;
}

function destroy(orig, data) {
    for (i = 0, len = orig.length; i < len; ++i) {
        if (orig[i].id === data.id) {
            orig.splice(i, 1);

            return true;
        }
    }

    return false;
}

function getMembers(nodes) {
    var result = [];

    while (nodes.hasNext()) {
        var node = nodes.next();

        result.push([propertyUtil.getString(node, 'backingUser'), propertyUtil.getString(node, 'displayName')]);
    }

    return result;
}

function getNames(nodes) {
    var result = [];

    while (nodes.hasNext()) {
        var node = nodes.next();

        result.push(propertyUtil.getString(node, 'displayName'));
    }

    return result;
}

function publish(type, obj) {
    metadataUtil.setMetadataPropertyValue(projectData, type, JSON.stringify(obj));
    publishingUtil.publishNode(projectData);
}

function getStatus(group) {
    var groups = group.getNodes();

    while (groups.hasNext()) {
        var node = groups.next();

        if (propertyUtil.getString(node, 'jcr:primaryType') == 'sv:collaborationGroup') {
            return propertyUtil.getString(node, 'groupType');
        }
    }

    return null;
}


function memberOfGroup(user, groupName) {
    var result = directoryUtil.search(groupName).iterator();

    if (!result.hasNext()) return false;

    while (result.hasNext()) {
        var group = result.next();

        if (propertyUtil.getStrings(group, 'member').contains(propertyUtil.getString(user, 'jcr:uuid'))) return true;
    }

    return false;
}

function validate(type, data) {
    for (i = 0, len = REQUIRED[type].length; i < len; ++i) {
        if (!data.hasOwnProperty(REQUIRED[type][i])) return false;
    }

    return true;
}

function getFiles(nodes, result, path) {
    if (!path) path = "";

    path += "/";

    if (nodes.hasNext()) {
        while (nodes.hasNext()) {
            var node = nodes.next();

            if (propertyUtil.getString(node, "jcr:primaryType").equals("sv:folder")) {
                getFiles(node.getNodes(), result, path + propertyUtil.getString(node, "displayName"));
            } else {
                result.push({
                    name: propertyUtil.getString(node, "fileName"),
                    id: node.getIdentifier(),
                    path: path
                });
            }
        }
    }

    return result;
}

function createGroup( aData, anEnum ) {


    try
    {
        var localTemplate = session.getNodeByIdentifier( TEMPLATE ),
            localProjectFolder = session.getNodeByIdentifier(PROJECTS_FOLDER);

        var localGroup = collaborationGroupUtil.createCollaborationGroup( localTemplate, localProjectFolder, aData.name, anEnum ).getParent();
        return localGroup;

    }catch( e )
    {
        logUtil.error("Unable to create group: " + e );
    }

    return '';
}

function createProjectData( aGroup ) {

    var localArchiveProject = session.getNodeByIdentifier(ARCHIVE_PROJECT),
        localTemplateProject = session.getNodeByIdentifier(TEMPLATE_PROJECT);

    try {
        var localProjectData = articleUtil.createArticle( localArchiveProject, localTemplateProject, aGroup.getIdentifier());
        return localProjectData;
    } catch ( e ) {
        logUtil.error("Unable to create project data: " + e );
    }

    return '';
}

function moveNodeToTrashcan( aNode ) {

    /* Sitevision API dont support moving a group to trashcan, move it to another folder instead */

    /* Contacted sitevision support 2017-11-29 to ask them to add support for group node type */

    /*
    try {
        trashcanUtil.moveNodeToTrashcan( aNode );
    } catch ( e ) {
        logUtil.error( 'Could not move: ' + aNode + ' to trashcan, error: ' + e );
    }
    */

    try {
        structureUtil.moveNode( aNode, session.getNodeByIdentifier( UNPUBLISHED_PROJECTS ) );
    } catch ( e ) {
        logUtil.error( 'Could not move: ' + aNode + ' to unpublished projects folder, error: ' + e );
    }



}

function setGroupToClosedType( aGroup ) {
    var collaborationFactory = require( 'CollaborationFactory' ),
        groupWrapper = collaborationFactory.getCollaborationGroupWrapper( aGroup );

    try {
        groupWrapper.setGroupType( require('CollaborationGroupType.CLOSED') );
    } catch ( e ) {
        logUtil.error( 'Cloud not set group: ' + aGroup + ' to CLOSED type: ' + e );
    }

}

if (request.getParameter('node') && !request.getParameter('node').equals(''))
{

    if (request.getParameter('node').equals('META'))
    {
        var meta = session.getNodeByIdentifier(PROJECTS_FOLDER),
            get = request.getParameter('get');

        if (get && !get.equals(''))
        {
            switch(get) {
                case 'processes':
                    out.println(JSON.stringify(getNames(metadataDefinitionUtil.getDefinition(meta, 'processnamn').getNodes())));
                    break;
                case 'projecttypes':
                    out.println(JSON.stringify(getNames(metadataDefinitionUtil.getDefinition(meta, 'projekttyp').getNodes())));
                    break;
                case 'types':
                    out.println(JSON.stringify(getNames(metadataDefinitionUtil.getDefinition(meta, 'timeline.types').getNodes())));
                    break;
                case 'tomrs':
                    out.println(JSON.stringify(getNames(metadataDefinitionUtil.getDefinition(meta, 'trafikomrade').getNodes())));
                    break;
                default:
                    out.println('[]');
                    break;
            }
        } else
        {
            out.println('[]');
        }
    } else if (request.getParameter('node').equals('NEW'))
    {
        logUtil.info('Creating new project');
        var collaborationGroupUtil = utils.getCollaborationFactory().getCollaborationGroupUtil(),
            relatedValueBuilder = metadataUtil.getRelatedValueBuilder(),
            currentUser = portletContextUtil.getCurrentUser(),
            data = request.getParameter('data');

        try
        {
            data = JSON.parse(data);
        } catch (e)
        {
            data = {};
        }

        if (!data || !validate('information', data))
        {
            out.println('{"message": "Felaktiga värden"}');
        } else
        {
            logUtil.info("JSON data valid, creation of project started");

            var group, projectData, status;

            try
            {

                var currentUser = portletContextUtil.getCurrentUser();
                logUtil.error("User is = " + currentUser);

                if(data.status==="OPEN"){
                    status = 'OPEN';
                    group = createGroup( data, require('CollaborationGroupType.OPEN') );
                }
                else{
                    status = "CLOSED";
                    // WA --> Always create OPEN type and then set it CLOSED
                    group = createGroup( data, require('CollaborationGroupType.OPEN') );
                    //group = createGroup( data, require('CollaborationGroupType.CLOSED') );
                }

                projectData = createProjectData( group );

                try
                {
                    var readEnum = require('PermissionUtil.Permission.CREATE_CLOSED_COLLABORATION_GROUP');
                    var canDo = permissionUtil.hasPermission(group, currentUser, readEnum);

                    if(canDo)
                    {
                        logUtil.error("canDo");

                    } else{
                        logUtil.error("Cant create closed group, not allowed.");
                        logUtil.error("Group : " + group);
                        logUtil.error("Current User : " + currentUser);
                        logUtil.error("Read Enum : " + readEnum);
                    }

                }catch(e)
                {
                    logUtil.error("Unable to check permission " + e);
                }


                try
                {
                    logUtil.info("Try to create conext for user (row 254)");
                    relatedValueBuilder.addUser(currentUser);
                } catch(e)
                {
                    logUtil.error("Unable to add currentUser to related metadata");
                }

                data.notifications = "Ja";
                data.filesAsActivities = "Ja";


                if (!memberOfGroup(currentUser, 'WEB-RACCOON-PROJECT-MANAGER'))
                {
                    data.group = 'Nej';
                }

                try
                {
                    metadataUtil.setMetadataPropertyValue(group, 'project.data', projectData.getIdentifier());

                    try
                    {
                        metadataUtil.setMetadataPropertyValue(group, 'adminUsers', relatedValueBuilder.build());
                    } catch(e)
                    {
                        logUtil.error("Could not set related metadata on group: " + group + ", " + e);
                    }

                    try {
                        metadataUtil.setMetadataPropertyValue(projectData, 'data.information', JSON.stringify(data));
                    } catch ( e ) {
                        logUtil.error("Problem to set metadata: " + e);
                    }

                    try {
                        publishingUtil.publishNode(projectData);
                    } catch ( e ) {
                        logUtil.error("Problem to publish project data: " + e);
                    }

                    try {
                        publishingUtil.publishNode(group);
                    } catch ( e ) {
                        logUtil.error("Problem to publish group page: " + e);
                    }


                } catch (e)
                {
                    logUtil.error("Problem to set metadata and publish: " + e);
                    out.println('{"message": "Problem to set metadata and publish"}');
                }



                if ( status.equals( 'CLOSED' ) ) {
                    logUtil.error( 'Setting group: ' + group  + ' to closed type...' );
                    setGroupToClosedType( group );
                }



                if (data.templateId) {
                    var templateNode = session.getNodeByIdentifier(data.templateId),
                        templateNodeRepo = resourceLocatorUtil.getLocalFileRepository(templateNode).getNodes(),
                        groupRepo = resourceLocatorUtil.getPersonalFileRepository(group),
                        i = 0;

                    metadataUtil.setMetadataPropertyValue(projectData, 'data.timeline', propertyUtil.getString(templateNode, 'data.timeline'));
                    metadataUtil.setMetadataPropertyValue(projectData, 'data.budget', propertyUtil.getString(templateNode, 'data.budget'));

                    while (templateNodeRepo.hasNext()) {
                        var file = templateNodeRepo.next();

                        try {
                            fileUtil.createFile(groupRepo, propertyUtil.getString(file, 'displayName'), propertyUtil.getString(file, 'URL') + '?name=system&pwd=Bouvet@Nobina2014!');
                        } catch (e) {}

                        ++i;

                        if (i > 250) break;
                    }

                    publishingUtil.publishNode(projectData);
                }

                out.println('"' + propertyUtil.getString(group, 'URI') + '"');
            } catch (e)
            {
                out.println('{"message": "Projektet finns redan"}');

            }
        }
    } else if (request.getParameter('node').equals('ALL'))
    {
        var nodeIteratorUtil = utils.getNodeIteratorUtil(),
            projectFolder = session.getNodeByIdentifier(PROJECTS_FOLDER),
            projects = nodeIteratorUtil.getMenuItems(projectFolder),
            result = [];
// Update 2017-09-20, try/catch of more values to remove error projects
        if (projects.hasNext()) {
            while(projects.hasNext()) {
                var project = projects.next(),
                    projectData ="",
                    budget = "",
                    information = "",
                    timeline = "";
                try{
                    projectData = session.getNodeByIdentifier(propertyUtil.getString(project, 'project.data'));
                } catch (e){
                    projectData = "";
                }
                try{
                    budget = propertyUtil.getString(projectData, 'data.budget');
                    budget = JSON.parse(budget);
                } catch (e){
                    budget = "";
                }

                try{
                    information = propertyUtil.getString(projectData, 'data.information');
                    information = JSON.parse(information);
                } catch (e){
                    information = "";
                }
                try{
                    timeline = propertyUtil.getString(projectData, 'data.timeline');
                    timeline = JSON.parse(timeline);
                } catch (e){
                    timeline = "";
                }
                if((budget !== "") && information !== ""  && timeline !== ""){
                    information.status = getStatus(project);
                    information.name = propertyUtil.getString(project, 'displayName');
                    information.url = propertyUtil.getString(project, 'URI');
                    information.id = project.getIdentifier();
                    result.push({
                        budget: budget,
                        information: information,
                        timeline: timeline
                    });
                }
            }
        }
        out.println(JSON.stringify(result));
    } else if (request.getParameter('node').equals('TEMPLATE'))
    {
        var currentUser = portletContextUtil.getCurrentUser(),
            templateNode = articleUtil.createArticle(session.getNodeByIdentifier(ARCHIVE_TEMPLATE), session.getNodeByIdentifier(TEMPLATE_TEMPLATE), 'Ny Mall');

        metadataUtil.setMetadataPropertyValue(templateNode, 'project.data', '{}');
        metadataUtil.setMetadataPropertyValue(templateNode, 'data.timeline', '[]');
        metadataUtil.setMetadataPropertyValue(templateNode, 'data.budget', '[]');

        publishingUtil.publishNode(templateNode);

        out.println('"' + propertyUtil.getString(templateNode, 'URI') + '"');
    } else
    {
        var page = session.getNodeByIdentifier(request.getParameter('node')),
            projectData = session.getNodeByIdentifier(propertyUtil.getString(page, 'project.data')),

            collaborationGroupWrapper = utils.getCollaborationFactory().getCollaborationGroupWrapper(page),

            information = propertyUtil.getString(projectData, 'data.information'),
            timeline = propertyUtil.getString(projectData, 'data.timeline'),
            budget = propertyUtil.getString(projectData, 'data.budget'),
            members = getMembers(collaborationGroupWrapper.getMembers().iterator()),
            currentUser = portletContextUtil.getCurrentUser(),

            isAdmin = collaborationGroupWrapper.isAdmin( currentUser ),
            isMember = collaborationGroupWrapper.isMember(portletContextUtil.getCurrentUser()),

            get = request.getParameter('get'),
            modify = request.getParameter('modify'),
            remove = request.getParameter('remove');

        try { budget = JSON.parse(budget); }
        catch (e) { budget = []; }
        try { timeline = JSON.parse(timeline); }
        catch (e) { timeline = []; }
        try { information = JSON.parse(information); }
        catch (e) { information = {}; }

        information.status = getStatus(page);
        information.name = propertyUtil.getString(page, 'displayName');

        if (get && !get.equals('')) {
            switch (get) {
                case 'budget':
                    out.println(JSON.stringify(budget));
                    break;
                case 'information':
                    out.println(JSON.stringify(information));
                    break;
                case 'members':
                    out.println(JSON.stringify(members));
                    break;
                case 'timeline':
                    var timeline = {
                        events: timeline,
                        files: []
                    };

                    getFiles(resourceLocatorUtil.getPersonalFileRepository(page).getNodes(), timeline.files);

                    out.println(JSON.stringify(timeline));
                    break;
                case 'all':
                    out.println(JSON.stringify({
                        budget: budget,
                        information: information,
                        members: members,
                        timeline: timeline,
                    }));
                    break;
                default:
                    out.println('[]');
                    break;
            }
        } else if (modify && !modify.equals(''))
        {
            var data = request.getParameter('data') && !request.getParameter('data').equals('') ? request.getParameter('data') : false;

            try { data = JSON.parse(data); }
            catch (e) { data = false; }

            switch (modify) {
                case 'budget':
                    if (!data || !validate('budget', data)) {
                        out.println('[]');

                        break;
                    }

                    budget = append(budget, data);
                    publish('data.budget', budget);

                    out.println(JSON.stringify(data));

                    break;
                case 'information':
                    if (!data || !validate('information', data) || !isAdmin) break;

                    if (!data.group) {
                        data.group = information.group;
                    }

                    if (!data.agresso) {
                        data.agresso = information.agresso;
                    }

                    publish('data.information', data);

                    if (data.name) {
                        data.name = collaborationGroupWrapper.renameGroup(data.name);
                    }

                    out.println(JSON.stringify(data));

                    break;
                case 'timeline':
                    if (!data || !validate('timeline', data)) break;

                    timeline = append(timeline, data);
                    publish('data.timeline', timeline);

                    out.println(JSON.stringify(data));

                    break;
                case 'remove':
                    if (!isAdmin) {

                        logUtil.error( 'Not admin user, controlling if is metadata admin user...' );

                        if ( !metadataUtil.getRelatedMetadataPropertyValues( page ,'adminUsers' ).contains( currentUser ) ) {
                            logUtil.error( 'Not metadata admin user, wont unpublish...' );
                            break;
                        }

                    }

                    try {
                        publishingUtil.unpublishNode( page );
                    } catch ( e ) {
                        logUtil.error( 'Could not unpublish page: ' + e );
                    }


                    // moveNodeToTrashcan( page );

                    out.println('Success');

                    break;
                default:
                    out.println('[]');
                    break;
            }
        } else if (remove && !remove.equals(''))
        {
            var data = request.getParameter('data') && !request.getParameter('data').equals('') ? JSON.parse(request.getParameter('data')) : false;

            switch (remove) {
                case 'budget':
                    if (!data) break;

                    destroy(budget, data);
                    publish('data.budget', budget);

                    out.println(JSON.stringify(data));

                    break;
                case 'timeline':
                    if (!data) break;

                    destroy(timeline, data);
                    publish('data.timeline', timeline);

                    out.println(JSON.stringify(data));

                    break;
                default:
                    out.println('[]');
                    break;
            }
        }
    }
} else
{
    var GUI = true,
        URL = "/" + portletContextUtil.getCurrentPage().getIdentifier() + "/" + portletContextUtil.getCurrentPortlet().getIdentifier() + ".json";
}


