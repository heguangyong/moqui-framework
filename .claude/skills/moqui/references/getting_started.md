# Moqui_Complete - Getting Started

**Pages:** 10

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/IDE+Setup

**Contents:**
      - Wiki Spaces
      - Page Tree
- IDE Setup

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

See pages below this page for information about setting up and working with Moqui in various IDEs.

---

## Moqui Documentation

**URL:** https://www.moqui.org/docs/framework/Quick+Tutorial

**Contents:**
      - Wiki Spaces
      - Page Tree
- Moqui Framework Quick Tutorial
- Overview
- Part 1
  - Download Moqui Framework
  - Create a Component
  - Add a Screen
  - Mount as a Subscreen
  - Try Included Content

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

This tutorial is a step-by-step guide to creating and running your own Moqui component with a user interface, logic, and database interaction.

Part 1: To get started you'll be creating your own component and a simple "Hello world!" screen.

Part 2: Continuing from there you'll define your own entity (database table) and add forms to your screen to find and create records for that entity.

Part 3: To finish off the fun you will create some custom logic instead of using the default CrUD logic performed by the framework based on the entity definition.

The running approach used in this document is a simple one using the embedded servlet container. For more complete coverage of running and deployment options, and of the general directory structure of Moqui Framework, please read the Run and Deploy document.

If you haven't already downloaded Moqui Framework, do that now.

Run Moqui using the Running and Deployment Instructions.

In your browser go to http://localhost:8080/, log in as John Doe, and look around a bit.

Now quit (<ctrl>-c in the command line) and you're ready to go...

Moqui follows the "convention over code" principle for components, so all you really have to do to create a Moqui component is create a directory:

$ cd runtime/component$ mkdir tutorial

Now go into the directory and create some of the standard directories that you'll use later in this tutorial:

$ cd tutorial$ mkdir data$ mkdir entity$ mkdir screen$ mkdir script$ mkdir service

Using your favorite IDE or text editor add a screen XML file in:

runtime/component/tutorial/screen/tutorial.xml

For now let this be a super simple screen with just a "Hello world!" label in it. The contents should look something like:

Note that the screen.@require-authentication attribute is set to "anonymous-all". This effectively disables the default security settings of screens where both authentication (login) and authorization to access the screen are required. The apps.xml screen uses the "false" setting for this attribute which is similar but does not login an 'anonymous' user or disable authorization for 'all' (not just view) actions on the screen.

For more information on Moqui Artifact Authorization see the Security document.

Another thing to notice is the xmlns:xsi and xsi:noNamespaceSchemaLocation attribute which are used to specify the XSD file to use for validation and auto-completion in your IDE. Depending on your IDE you may need to go through different steps to configure it so that it knows how to find the local XSD file for the location specified (it is a valid HTTP URL but that's not how XSD URIs work). See the documents under the IDE Setup document.

To make your screen available it needs to be added as a subscreen to a screen that is already under the root screen somewhere. In Moqui screens the URL path to the screen and the menu structure are both driven by the subscreen hierarchy, so this will setup the URL for the screen and add a menu tab for it.

For the purposes of this tutorial we'll use the existing root screen and header/footer/etc that are in the included runtime directory. This runtime directory has a webroot component with the root screen at:

runtime/base-component/webroot/screen/webroot.xml

On a side note, the root screen is specified in the Moqui Conf XML file using the webapp-list.webapp.root-screen element, and you can have multiple elements to have different root screens for different host names. See the Run and Deploy guide for more information on the Moqui Conf XML file.

To make the screen hierarchy more flexible this root screen only has a basic HTML head and body, with no header and footer content, so let's put our screen under the apps screen which adds a header menu and will give our screen some context.

There are 4 ways to make a screen a subscreen of another screen described in the User Interface => XML Screen document. For this tutorial we'll use the component MoquiConf.xml file approach which is merged into the MoquiDefaultConf.xml file included in the framework when Moqui starts along with MoquiConf.xml files in other components and the runtime Moqui Conf XML file optionally specified in a startup command line argument. This is the recommended approach for adding a new 'app' to Moqui and is used in PopCommerce, HiveMind, etc.

Add a MoquiConf.xml file to the root directory of your component:

runtime/component/tutorial/MoquiConf.xml

While you can include anything supported in the Moqui Conf XML file to mount a subscreen we'll just use the screen-facade.screen element like:

With your component in place just start up Moqui (with java -jar moqui.war or the like).

The subscreens-item.name attribute specifies the value for the path in the URL to the screen, so your screen is now available in your browser at:

http://localhost:8080/apps/tutorial

It is also available in the new Vue JS based hybrid server + client application wrapper under /vapps which uses the screens mounted under /apps:

http://localhost:8080/vapps/tutorial

Instead of using the label element we can get the HTML from a file that is "under" the screen.

First create a simple HTML file located in a tutorial directory under our component's screen directory:

runtime/component/tutorial/screen/tutorial/hello.html

The HTML file can contain any HTML, and since this will be included in a screen whose parent screens take care of header/footer/etc we can keep it very simple:

Now just explicitly include the HTML file in the tutorial.xml screen definition using a render-mode.text element just after the label element from the first version of this file above. The full file should now look like:

So what is this render-mode thingy? Moqui XML Screens are meant to platform agnostic and may be rendered in various environments. Because of this we don't want anything in the screen that is specific to a certain mode of rendering the screen without making it clear that it is. Under the render-mode element you can have various sub-elements for different render modes, even for different text modes such as HTML, XML, XSL-FO, CSV, and so on so that a single screen definition can be rendered in different modes and produce output as needed for each mode.

Since Moqui 2.1.0 the Vue JS based hybrid client/server rendering functionality is available. This uses the render mode 'vuet' instead of 'html' because the output is actually a Vue template and not standard HTML. The text.@type attribute is "html,vuet" so that the HTML from the file is included for both render modes.

The screen is available at the same URL, but now includes the content from the HTML file instead of just having it inline as a label in the screen definition.

One side effect of putting the hello.html file under a mounted screen using the matching directory name (tutorial for tutorial.xml) is that this file is also available for direct access with a URL like:

http://localhost:8080/apps/tutorial/hello.html

When you go to this URL you won't see the header from the apps.xml screen because it is directly accessing the file. This is can be used for other static (not server rendered) text files like CSS, JavaScript, and even binary files like images. Typically it's best to use a separate parent screen for static content as the SimpleScreens and HiveMind do, but it can be mixed with screens in any screen hierarchy.

What if you don't want the raw HTML from hello.html to be available through an HTTP request? What if you only want it to be usable as an include in a screen? To do that just don't put it in a directory that isn't under a mounted screen. A common approach to this is to add a template directory to your component and put the templates and files there. For example:

runtime/component/tutorial/template/tutorial/hello.html

With hello.html in that directory the location you specify to include it in the screen also changes, like:

An entity is a basic tabular data structure, and usually just a table in a database. An entity value is equivalent to a row in the database. Moqui does not do object-relational mapping, so all we have to do is define an entity, and then start writing code using the Entity Facade (or other higher level tools) to use it.

To create a simple entity called "Tutorial" with fields "tutorialId" and "description" create an entity XML file at:

runtime/component/tutorial/entity/TutorialEntities.xml

Add an entity definition to that file like:

If you're running Moqui in dev mode the entity definition cache clears automatically so you don't have to restart, and for production mode or if you don't want to wait (since Moqui does start very fast) you can just stop and start the JVM.

How do you create the table in the database? When running with the embedded H2 database Moqui can create tables on the fly and will do so the first time to use the new entity. This used to also work with MySQL but due to transactional handling of create table it no longer does. Creating a table and other DB meta data operations are usually not allowed in the middle of an active transaction so it must be done in advance and for most databases Moqui Framework does adds missing tables, columns, foreign keys, and indexes only on startup (which can also be turned off by configuration or env var).

The Entity Facade has functionality to load data from, and write data to, XML files that basically elements that match entity names and attributes that map field names.

We'll create a UI to enter data later on, and you can use the Auto Screens or Entity Data Import screen in the Tools application to work with records in your new entity. Data files are useful for seed data that code depends on, data for testing, and data to demonstrate how a data model should be used. So, let's try it.

Create an Entity Facade XML data file at:

runtime/component/tutorial/data/TutorialDemoData.xml

In the file add an entity-facade-xml element with sub-elements for the full entity name which is the package and the entity-name together (tutorial.Tutorial):

Note that the type attribute is set to "demo". This is used when running a general data load (java -jar moqui.war load) where limited data file types may be specified to load. You can use any simple text for the data file type but there are a few standard types used in the framework such as seed, seed-initial, install, demo, and test.

The standard set of types to load on production instances is seed, seed-initial, and install. The demo type is used for demo data used during development and testing. The test type is for file that overwrite production settings stored in the database so that clones of a production database are safer to use for end user experimenting or developer testing and gets loaded automatically when Moqui starts if the instance_purpose is set to "test".

For more information on data loading see the Data and Resources => Entity Data Import and Export document.

The easiest way to load this is from the Data Import screen in the Tools app:

http://localhost:8080/vapps/tools/Entity/DataImport

Click on the XML Text section of the form, paste in the XML above, then click on the Import Data - Create Only button. You can also click on the Import Data - Create or Update button but because we know these records aren't already there we can use the Create Only variation which is intended for loading data on production servers where you don't want to replace existing records that may have been modified.

To load this from the command line, with Moqui not already running, just run $ ./gradlew load or one of the other load variations described in the Run and Deploy document.

We're about to add a sub-screen under our tutorial.xml screen but so far it doesn't do anything with sub-screens. We need to tell the framework where in the widgets to include the active sub-screen and we do that by adding a subscreens-active element.

For good measure it is best to always have a default sub-screen for each screen that supports sub-screens so that any partial URL still goes somewhere useful. That is done using the subscreens.@default-item attribute which we'll set to "FindTutorial" to match the name of the screen we're about to add.

While we're at it let's make our new application secure and add authorization configuration so it is accessible. To make it secure just remove the screen.@require-authentication attribute.

With those changes our tutorial.xml screen should now look like:

With the subscreens-active element below the label and render-mode elements from our previous screen the tutorial.xml screen is now a wrapper around all sub-screens so the "Hello world!" text gets displayed above the sub-screen widgets.

To configure authorization we'll need some data in the database, and we'll put it in a file for future reference even though for now it is easiest to just load through the Data Import screen in the Tools app as we did above. Create a new data XML file at:

runtime/component/tutorial/data/TutorialSetupData.xml

In the file we'll need 3 records:

Note that we're using the ALL_USERS group in this example. This group is a special one in the framework that all users are automatically a member of. That makes it different from any other group, like the OOTB ADMIN group which only includes members for records in the UserGroupMember entity.

Load this data now thought the Data Import screen in the Tools app so that it is in place when we try our new find screen below.

Now we have a more complete shell for our new application and we're ready to add a find screen.

Add the XML screen definition below as a sub-screen of the tutorial.xml screen by putting it in a file at:

runtime/component/tutorial/screen/tutorial/FindTutorial.xml

This uses the Directory Structure approach for adding sub-screens described in the User Interface => XML Screen document.

This screen has a couple of key parts:

To view this screen use this URL:

http://localhost:8080/vapps/tutorial/FindTutorial

Instead of the default for the description field, what if you wanted to specify how it should look at what type of field it should be?

To do this just add a field element inside the form-list element, and just after the auto-fields-entity element, like this:

Because the field name attribute is the same as a field already created by the auto-fields-entity element it will override that field. If the name was different an additional field would be created. The result of this is basically the same as what was automatically generated using the auto-fields-entity element except that the options are hidden for the text-find field (inspect it in your browser to see that other find parameters are still there with default options, ie this is different from a plain text-line).

Let's add a button that will pop up a Create Tutorial form, and a transition to process the input.

Think of links between screens as an ordered graph where each screen is a node and the transitions defined in each screen are how you go from that screen to another (or back to the same), and as part of that transition optionally run server-side actions or a service. A single transition can have multiple responses with conditions and for errors resulting in transition to various screens as needed by your UI design.

First add a transition to the FindTutorial.xml screen you created before, just above the actions element:

This transition calls the create#tutorial.Tutorial service, and then goes back to the current screen.

Where did the create#tutorial.Tutorial service come from? We haven't defined anything like that yet. The Moqui Service Facade supports a special kind of service for entity CrUD operations that don't need to be defined, let alone implemented. This service name consists of two parts, a verb and a noun, separated by a hash (#). As long as the verb is create, update, store, or delete and the noun is a valid entity name the Service Facade will treat it as an implicit entity-auto service and do the desired operation. It does so based on the entity definition and the parameters passed to the service call. For example, with the create verb and an entity with a single primary key field if you pass in a value for that field it will use it, otherwise it will automatically sequence a value using the entity name as the sequence key.

Next let's add the create form, in a hidden container that will expand when a button is clicked. Put this inside the widget element, just above the form-list element in the original FindTutorial.xml screen you created before so that it appears above the list form in the screen:

The form definition refers to the transition you just added to the screen, and uses the auto-fields-entity element with edit for the field-type to generate edit fields. The last little detail is to declare a button to submit the form, and it's ready to go.

Try it out and see the records appear in the list form that was part of the original screen.

The createTutorial transition from our screen above used the implicit entity-auto service create#tutorial.Tutorial. Let's see what it would look like to define and implement a service manually.

First lets define a service and use the automatic entity CrUD implementation:

runtime/component/tutorial/service/tutorial/TutorialServices.xml

This will allow all fields of the Tutorial entity to be passed in, including an optional tutorialId which is the primary key field and a sequenced ID will be generated no value is specified. It will always return the PK field (tutorialId). Note that with the auto-parameters element we are defining the service based on the entity, and if we added fields to the entity they would be automatically represented in the service.

One quirk with service.@type set to "entity-auto" is that it uses the service.@noun for the entity name. It works like this without the entity package included in the name because the framework allows using entity names without a package, though you may be inconsistent results if there are multiple entities with the same name in different packages.

Now change that service definition to add an inline implementation as well. Notice that the service.@type attribute has changed, and the actions element has been added.

Now to call the service instead of the implicit entity-auto one just change the transition to refer to this service:

Note that the service name for a defined service like this is like a fully qualified Java class name. It has a "package", in this case "tutorial", which is the directory (and may be a path with multiple directories separated by dots) under the component/service directory. Then there is a dot and the equivalent of the class name, in this case "TutorialServices" which is the name of the XML file the service is in, but without the .xml extension. After that is another dot, and then the service name with the verb and noun optionally separated by a hash (#).

What if you want to implement the service in Groovy (or some other supported scripting language) instead of the inline XML Actions? Try adding another service definition like this to the TutorialServices.xml file (to test change the service name in FindTutorial.xml):

Notice that the service.@type attribute has changed to script, and there is now a service.@location attribute which specifies the location of the script.

Because we've change the service.@noun attribute to "TutorialGroovy" which is not a valid entity name we must specify the entity-name on the two auto-parameters elements. In other words by default it you don't specify auto-parameters.@entity-name the framework will try the service.@noun and in this case that will result in an error.

The script can be located anywhere in the component as we refer to it's location explicitly. For convenience we're adding it to the existing service/tutorial directory. Here is what the script would look like in that location:

When in Groovy, or other languages, you'll be using the Moqui Java API which is based on the ExecutionContext class which is available in the script with the variable name "ec". For more details on the API see the API JavaDocs and specifically the doc for the ExecutionContext class which has links to the other major API interface pages.

Now that you have soiled your hands with the details of Moqui Framework you're ready to explore the other documentation here in the Moqui Framework wiki space on moqui.org. Most of the content from the "Making Apps with Moqui" book has been migrated here and updated for changes and new functionality in the framework.

There is also documentation for Mantle Business Artifacts, including the UDM data model, available here on moqui.org.

If you will be doing any ERP related development the documentation for the POPC ERP app is highly recommended for both reading and reference to better understand business concepts and how end users go about doing various business activities in the app. This is also useful to find services to use by looking at how things are meant to be done in the ERP app and then looking at the transitions in the screens to see which services are used.

You may also enjoy reading through the Framework Features document.

**Examples:**

Example 1 (unknown):
```unknown
<?xml version="1.0" encoding="UTF-8"?>
<screen xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/xml-screen-2.1.xsd"
        require-authentication="anonymous-all">
    <widgets>
        <label type="h1" text="Hello world!"/>
    </widgets>
</screen>
```

Example 2 (unknown):
```unknown
<?xml version="1.0" encoding="UTF-8"?>
<screen xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/xml-screen-2.1.xsd"
        require-authentication="anonymous-all">
    <widgets>
        <label type="h1" text="Hello world!"/>
    </widgets>
</screen>
```

Example 3 (unknown):
```unknown
<?xml version="1.0" encoding="UTF-8" ?>
<moqui-conf xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/moqui-conf-2.1.xsd">
    <screen-facade>
        <screen location="component://webroot/screen/webroot/apps.xml">
            <subscreens-item name="tutorial" menu-title="Tutorial" menu-index="99"
                    location="component://tutorial/screen/tutorial.xml"/>
        </screen>
    </screen-facade>
</moqui-conf>
```

Example 4 (unknown):
```unknown
<?xml version="1.0" encoding="UTF-8" ?>
<moqui-conf xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/moqui-conf-2.1.xsd">
    <screen-facade>
        <screen location="component://webroot/screen/webroot/apps.xml">
            <subscreens-item name="tutorial" menu-title="Tutorial" menu-index="99"
                    location="component://tutorial/screen/tutorial.xml"/>
        </screen>
    </screen-facade>
</moqui-conf>
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/IDE+Setup/IntelliJ+IDEA+Setup

**Contents:**
      - Wiki Spaces
      - Page Tree
- IntelliJ IDEA Setup
- Create Project from Gradle Files
- XML Schemas
- Language Injection for Groovy in XML

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

While you can create a project from VCS sources in IntelliJ this is not recommended, it is better to use the Gradle tasks from the command line to do all the git cloning for the framework, runtime, and all the components you want. For instructions on this see the Source Management Guide and the Run and Deploy document. With the source all cloned:

Once the window comes up you should see a message that says Unregistered VCS roots detected. Click on that, or go to the Version Control pane in the Settings dialog (File => Settings). There is will list the directories for all git repositories under Unregistered roots. Click on each and then on the green plus sign on the right.

This will give you the basic setup. As you update moqui-framework and others getting new build.gradle files IntelliJ will tell you its Gradle configuration is out of date. Click on the notification or the Gradle button (usually on the far right), then click on the blue circle/arrows button on the left to Refresh all Gradle projects.

IntelliJ requires some configuration to tell it which local file has the XSD for a given schema location.

The easiest and best way to set up the XML Schemas is to run the following in a moqui-framework repo:

Thanks to Taher's PR here.

To do this manually, open an existing Entity Definition, Service Definition, XML Screen, Service REST API, or other XML file and copy the value of the xsi:noNamespaceSchemaLocation attribute on the root element. Once you have the schema location copied, open the Settings dialog (File => Settings) and type in 'schema' in the search box to quickly get to the Languages & Frameworks => Schemas and DTDs pane. Once there:

In the Settings dialog (File => Settings) go to the Editor => Language Injections section. You will want one for at least the script element and nice to have them for attributes like from, condition, and in-map.

For the script and other elements:

For attributes it is the same except use XML Attribute Injection and specify the XML Attribute => Local Name. You can limit this to the attribute on specific elements, but that extra work is probably only worth it if you run into issues when editing other (non-Moqui) XML files with the same attribute names.

**Examples:**

Example 1 (unknown):
```unknown
./gradlew setupIntellij
```

Example 2 (unknown):
```unknown
./gradlew setupIntellij
```

Example 3 (unknown):
```unknown
xsi:noNamespaceSchemaLocation
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/docs/framework/Introduction

**Contents:**
      - Wiki Spaces
      - Page Tree
- Introduction to Moqui Framework
- What is the Moqui Ecosystem?
- What is Moqui Framework?
- Moqui Concepts
  - Application Artifacts
  - The Execution Context
  - The Artifact Stack
  - Peeking Under the Covers

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

The Moqui Ecosystem is a set of software packages built on a common framework and universal business artifacts. The packages are organized as separate open source projects to keep their purpose, management, and dependencies focused and clean. All are managed with a moderated community model, much like the Linux Kernel.

The goal of the ecosystem is to provide a number of interoperating and yet competing enterprise applications, all based on a common framework for flexibility and easy customization, and a common set of business artifacts (data model and services) so they are implicitly integrated.

The ecosystem includes:

The focus of this book is Moqui Framework, and the last chapter is a summary of Mantle Business Artifacts.

Moqui Framework is an all-in-one, enterprise-ready application framework based on Groovy and Java. The framework includes tools for screens, services, entities, and advanced functionality based on them such as declarative artifact-aware security and multi-tenancy.

The Framework is well suited for a wide variety of applications from simple web sites (like moqui.org) and small form-based applications to complex ERP systems. Applications built with Moqui are easy to deploy on a wide variety of highly scalable infrastructure software such as Java Servlet containers (or app servers) and both traditional relational and more modern NoSQL databases.

Moqui Framework is based on a decade of experience with The Open For Business Project (now Apache OFBiz, see http://ofbiz.apache.org) and designed and written by the person who founded that project. Many of the ideas and approaches, including the pure relational data layer (no object-relational mapping) and the service-oriented logic layer, stem from this legacy and are present in Moqui in a more refined and organized form.

With a cleaner design, more straightforward implementation, and better use of other excellent open source libraries that did not exist when OFBiz was started in 2001, the Moqui Framework code is about 20% of the size of the OFBiz Framework while offering significantly more functionality and more advanced tools.

The result is a framework that helps you build applications that automatically handles many concerns that would otherwise require a significant percentage of overall effort for every application you build.

The Moqui Framework toolset is structured around artifacts that you can create to represent common parts of applications. In Moqui the term artifact refers to anything you create as a developer and includes various XML files as well as scripts and other code. The framework supports artifacts for things like:

Here is a table of common parts of an application and the artifact or part of an artifact that handles each:

The ExecutionContext is the central application-facing interface in the Moqui API. An instance is created specifically for executing edge artifacts such as a screen or service. The ExecutionContext, or "ec" for short, has various facade interfaces that expose functionality for the various tools in the framework.

The ec also keeps a context map that represents the variable space that each artifact runs in. This context map is a stack of maps and as each artifact is executed a fresh map is pushed onto the stack, then popped off it once the artifact is done executing. When reading from the map stack it starts at the top and goes down until it finds a matching map entry. When writing to the map stack it always writes to the map at the top of the stack (unless to explicitly reference the root map, i.e., at the bottom of the stack).

With this approach each artifact can run without concern of interfering with other artifacts, but still able to easily access data from parent artifacts (the chain of artifacts that called or included down to the current artifact). Because the ec is created for the execution of each edge artifact it has detailed information about every aspect of what is happening, including the user, messages from artifacts, and much more.

As each artifact is executed and includes or calls other artifacts the artifact is pushed onto a stack that keeps track of the active artifacts, and is added to an artifact history list tracking each artifact used.

As artifacts are pushed onto the stack authorization for each artifact is checked, and security information related to the artifact is tracked. With this approach authz settings can be simplified so that artifacts that include or call or artifacts can allow those artifacts to inherit authorization. With inherited authorization configurations are only needed for key screens and services that are accessed directly.

When working with Moqui Framework you’ll often be using higher-level artifacts such as XML files. These are designed to support most common needs and have the flexibility to drop down to lower level tools such as templates and scripts at any point. At some point though you’ll probably either get curious about what the framework is doing, or you’ll run into a problem that will be much easier to solve if you know exactly what is going on under the covers.

While service and entity definitions are handled through code other artifacts like XML Actions and the XML Screens and Forms are just transformed into other text using macros in FreeMarker template files. XML Actions are converted into a plain old Groovy script and then compiled into a class which is cached and executed. The visual (widget) parts of XML Screens and Forms are also just transformed into the specified output type (html, xml, xsl-fo, csv, text, etc) using a template for each type.

With this approach you can easily see the text that is generated along with the templates that produced the text, and through simple configuration you can even point to your own templates to modify or extent the OOTB functionality.

Moqui Framework is designed to facilitate implementation with natural concept mappings from design elements such as screen outlines and wireframes, screen flow diagrams, data statements, and automated process descriptions. Each of these sorts of design artifacts can be turned into a specific implementation artifact using the Moqui tools.

These design artifacts are usually best when based on requirements that define and structure specific activities that the system should support to interact with other actors including people and systems. These requirements should be distinct and separate from the designs to help drive design decisions and make sure that all important aspects of the system are considered and covered in the designs.

With this approach implementation artifacts can reference the designs they are based on, and in turn designs can reference the requirements they are based on. With implementation artifacts that naturally map to design artifacts both tasking and testing are straightforward.

When implementing artifacts based on such designs the order that artifacts are created is not so important. Different people can even work simultaneously on things like defining entities and building screens.

For web-based applications, especially public-facing ones that require custom artwork and design, the static artifacts such as images and CSS can be in separate files stored along with screen XML files using the same directory structure that is used for subscreens using a directory with the same name as the screen. Resources shared among many screens live naturally under screens higher up in the subscreen hierarchy.

The actual HTML generated from XML Screens and Forms can be customized by overriding or adding to the FreeMarker macros that are used to generate output for each XML element. Custom HTML can also be included as needed. This allows for easy visual customization of the generic HTML using CSS and JavaScript, or when needed totally custom HTML, CSS, and JavaScript to get any effect desired.

Web designers who work with HTML and CSS can look at the actual HTML generated and style using separate CSS and other static files. When more custom HTML is needed the web designers can produce the HTML that a developer can put in a template and parameterize as needed for dynamic elements.

Another option that sometimes works well is to have more advanced web designers build the entire client side as custom HTML, CSS, and JavaScript that interacts with the server through a service interface using some form of JSON over HTTP. This approach also works well with client applications for mobile or desktop devices that will interact with the application server using web services. The web services can use the automatic JSON-RPC or XML-RPC or other custom automatic mappings, or can use custom wrapper services that call internal services to support any sort of web service architecture.

However your team is structured and however work is to be divided on a given project, with artifacts designed to handle defined parts of applications it is easier to split up work and allow people to work in parallel based on defined interfaces.

For requirements and designs you need a group content collaboration tool that will be used by users and domain experts, analysts, designers, and developers. The collaboration tool should support:

There are various options for this sort of tool, though many do not support all the above and collaboration suffers because of it. One good commercial option is Atlassian Confluence. Atlassian offers a very affordable hosted solution for small groups along with various options for larger organizations. There are various open source options, including the wiki built into HiveMind PM which is based on Moqui Framework and Mantle Business Artifacts.

Note that this content collaboration tool is generally separate from your code repository, though putting requirement and design content in your code repository can work if everyone involved is able to use it effectively. Because Moqui itself can render wiki pages and pass through binary attachments you might even consider keeping this in a Moqui component. The main problem with this is that until there is a good wiki application built on Moqui to allow changing the content, this is very difficult for less technical people involved.

For the actual code repository there are various good options and this often depends on personal and organizational preferences. Moqui itself is hosted on GitHub and hosted private repositories on GitHub are very affordable (especially for a small number of repositories). If you do use GitHub it is easy to fork the moqui/moqui repository to maintain your own runtime directory in your private repository while keeping up to date with the changes in the main project code base.

Even if you don’t use GitHub a local or hosted git repository is a great way to manage source code for a development project. If you prefer other tools such as Subversion or Mercurial then there is no reason not to use them.

For actual coding purposes you’ll need an editor or IDE that supports the following types of files:

My preferred IDE these days is IntelliJ IDEA from JetBrains. The free Community Edition has excellent XML and Groovy support. For HTML, CSS, JavaScript, and FreeMarker to go beyond a simple text editor you’ll have to pay for the Ultimate Edition. I implemented most of Moqui, including the complex FreeMarker macro templates, using the Community Edition. After breaking down and buying a personal license for the Ultimate Edition I am happy with it, but the Community Edition is impressively capable.

Other popular Java IDEs like Eclipse and NetBeans are also great options and have built-in or plugin functionality to support all of these types of files. I personally prefer having autocomplete and other advanced IDE functionality around, but if you prefer a more simple text editor then of course use what makes you happy and productive.

The Moqui Framework itself is built using Gradle. While I prefer the command line version of Gradle (and Git), most IDEs (including IntelliJ IDEA) include decent user interfaces for these tools that help simplify common tasks.

A request from a Web Browser will find its way to the framework by way of the Servlet Container (the default is the embedded Jetty Servlet Container, also works well with Apache Tomcat and other Java Servlet implementations). The Servlet Container finds the requested path on the server in the standard way using the web.xml file and will find the MoquiServlet mounted there. The MoquiServlet is quite simple and just sets up an ExecutionContext, then renders the requested Screen.

The screen is rendered based on the configured "root" screen for the webapp, and the subscreens path to get down to the desired target screen. Beyond the path to the target screen there may be a transition name for a transition of that screen.

A transition is part of a screen definition and is used to go one from screen to another (or back to the same). Transitions are used to process input (not to prepare data for presentation), which is separated from the screen actions which are used to prepare data for presentation (not to process input).

If there is a transition name in the URL path the service or actions of the transition will be run, a response to the transition selected (based on conditions and whether there was an error), and then the response will be followed, usually to another screen.

When a service is called (often from a transition or screen action) the Service Facade validates and cleans up the input parameters to the service call using the defined input parameters on the service definition, and then calls the defined inline or external script, Java method, auto or implicit entity operation, or remote service.

Entity operations, which interact with the database, should only be called from services for write operations and can be called from actions anywhere for read operations (transition or screen actions, service scripts/methods, etc).

Web Service requests generally follow the same path as a form submission request from a web browser that is handled by a Screen Transition. The incoming data will be handled by the transition actions, and typically the response will be handled by an action that sends back the encoded response (in XML, JSON, etc) and the default-response for the transition will be of type "none" so that no screen is rendered and no redirecting to a screen is done.

Incoming email is handled through Email ECA rules which are called by the org.moqui.impl.EmailServices.poll#EmailServer service (configured using the EmailServer entity). These rules have information about the email received parsed and available to them in structured Maps. If the condition of a rule passes, then the actions of the rule will be run. Rules can be written to do anything you would like, typically saving the message somewhere, adding it to a queue for review based on content, generating an automated response, and so on.

Outgoing email is most easily done with a call to the org.moqui.impl.EmailServices.send#EmailTemplate service. This service uses the passed in emailTemplateId to lookup an EmailTemplate record that has settings for the email to render, including the subject, the from address, the XML Screen to render and use for the email body, screens or templates to render and attach, and various other options. This is meant to be used for all sorts of emails, especially notification messages and system-managed communication like customer service replies and such.

**Examples:**

Example 1 (unknown):
```unknown
org.moqui.impl.EmailServices.poll#EmailServer
```

Example 2 (unknown):
```unknown
org.moqui.impl.EmailServices.send#EmailTemplate
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Logic+and+Services/Overview+of+XML+Actions

**Contents:**
      - Wiki Spaces
      - Page Tree
- Overview of XML Actions

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

The xml-actions-${version}.xsd file has thorough annotations for detailed documentation, this section is just an overview of what is available to help you get started. You can view the annotations through most good XML editors (including the better Java IDEs or IDE plugins), in the XSD file itself, or in the PDF on moqui.org that is generated from the XSD file.

Here is a summary of the most important XML Actions elements to be aware of:

---

## Moqui Documentation

**URL:** https://www.moqui.org/docs/framework/Tool+and+Config+Overview

**Contents:**
      - Wiki Spaces
      - Page Tree
- Framework Tool and Configuration Overview
- Execution Context and Web Facade
  - Web Parameters Map
  - Factory, Servlet & Listeners
- Resource and Cache Facades
- Screen Facade
  - Screen Definition
  - Screen/Form Render Templates

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

What follows is a summary of the various tools in the Moqui Framework and corresponding configuration elements in the Moqui Conf XML file. The default settings are in the MoquiDefaultConf.xml file, which is included in the executable WAR file in a binary distribution of Moqui Framework. This is a great file to look at to see some of the settings that are available and what they are set to by default. If you downloaded a binary distribution of Moqui Framework you can view this file online at (note that this is from the master branch on GitHub and may differ slightly from the one you downloaded):

https://github.com/moqui/moqui-framework/blob/master/framework/src/main/resources/MoquiDefaultConf.xml

Any setting in this file can be overridden in the Moqui Conf XML file that is specified at runtime along with the runtime directory (and generally in the conf directory under the runtime directory). The two files are merged before any settings are used, with the runtime file overriding the default one. Because of this, one easy way to change settings is simply copy from the default conf file and paste into the runtime one, and then make changes as desired.

TODO: add framework tools diagram from old OmniGraffle file

The Execution Context is the central object in the Moqui Framework API. This object maintains state within the context of a single server interaction such as a web screen request or remote service call. Through the ExecutionContext object you have access to a number of "facades" that are used to access the functionality of different parts of the framework. There is detail below about each of these facades.

The main state tracked by the Execution Context is the variable space, or "context", used for screens, actions, services, scripts, and even entity and other operations. This context is a hash or map with name/value entries. It is implemented with the ContextStack class and supports protected variable spaces with push() and pop() methods that turn it into a stack of maps. As different artifacts are executed they automatically push() the context before writing to it, and then pop() the context to restore its state before finishing. Writing to the context always puts the values into the top of the stack, but when reading the named value is searched for at each level on the stack starting at the top so that fields in deeper levels are visible.

In some cases, such as calling a service, we want a fresh context to better isolate the artifact from whatever called it. For this we use the pushContext() method to get a fresh context, then the popContext() method after the artifact is run to restore the original context.

The context is the literal variable space for the executing artifact wherever possible. In screens when XML actions are executed the results go in the local context. Even Groovy scripts embedded in service and screen actions share a variable space and so variables declared exist in the context for subsequent artifacts.

Some common expressions you’ll see in Moqui-based code (using Groovy syntax) include:

For an ExecutionContext instance created as part of a web request (HttpServletRequest) there will be a special facade called the Web Facade. This facade is used to access information about the servlet environment for the context including request, response, session, and application (ServletContext). It is also used to access the state (attributes) of these various parts of the servlet environment including request parameters, request attributes, session attributes, and application attributes.

The request parameters "map" (ec.web.requestParameters) is a special map that contains parameters from the URL parameter string, inline URL parameters (using the "/~name=value/" format), and multi-part form submission parameters (when applicable). There is also a special parameters map (ec.web.parameters) that combines all the other maps in the following order (with later overriding earlier): request parameters, application attributes, session attributes, and request attributes. That parameters map is a stack of maps just like the context so if you write to it the values will go in the top of the stack which is the request attributes.

For security reasons the request parameters map is canonicalized and filtered. This and the Service Facade validation help to protect agains XSS and injection attacks.

Execution Context instances are created by the Execution Context Factory. This can be done directly by your code when needed, but is usually done by a container that Moqui Framework is running in.

The most common way to run Moqui Framework is as a webapp through either a WAR file deployed in a servlet container or app server, or by running the executable WAR file and using the embedded Jetty Servlet Container. In either case the Moqui root webapp is loaded and the WEB-INF/web.xml file tells the servlet container to load the MoquiServlet, the MoquiSessionListener, and the MoquiContextListener. These are default classes included in the framework, and you can certainly create your own if you want to change the lifecycle of the ExecutionContextFactory and ExecutionContext.

With these default classes the ExecutionContextFactory is created by the MoquiContextListener on the contextInitialized() event, and is destroyed by the same class on the contextDestroyed() event. The ExecutionContext is created using the factory by the MoquiServlet for each request in the doGet() and doPost() methods, and is destroyed by the MoquiServlet at the end of each request by the same method.

The Resource Facade is used to access and execute resource such as scripts, templates, and content. The Cache Facade is used to do general operations on caches, and to get a reference to a cache as an implementation of the Cache interface. Along with supporting basic get/put/remove/etc operations you can get statistics for each cache, and modify cache properties such as timeouts, size limit, and eviction algorithm. The default Cache Facade implementation is just a wrapper around ehcache, and beyond the cache-facade configuration in the Moqui Conf XML file you can configure additional options using the ehcache.xml file.

The Resource Facade uses the Cache Facade to cache plain text by its source location (for getLocationText() method), compiled Groovy and XML Actions scripts by their locations (for the runScriptInCurrentContext method), and compiled FreeMarker (FTL) templates also by location (for the renderTemplateInCurrentContext() method).

There is also a cache used for the small Groovy expressions that are scattered throughout XML Screen and Form definitions, and that cache is keyed by the actual text of the expression instead of by a location that it came from (for the evaluateCondition(), evaluateContextField(), and evaluateStringExpand() methods).

For more generic access to resources the getLocationReference() method returns an implementation of the ResourceReference interface. This can be used to read resource contents (for files and directories), and get information about them such as content/MIME type, last modified time, and whether it exists. These resource references are used by the rest of the framework to access resources in a generic and extensible way. Implementations of the ResourceReference interface can be implemented as needed and default implementations exist for the following protocols/schemes: http, https, file, ftp, jar, classpath, component, and content (JCR, i.e., Apache Jackrabbit).

The API of the Screen Facade is deceptively simple, mostly just acting as a factory for the ScreenRender interface implementation. Through the ScreenRender interface you can render screens in a variety of contexts, the most common being in a service with no dependence on a servlet container, or in response to a HttpServletRequest using the ScreenRender.render(request, response) convenience method.

Generally when rendering and a screen you will specify the root screen location, and optionally a subscreen path to specify which subscreens should be rendered (if the root screen has subscreens, and instead of the default-item for each screen with subscreens). For web requests this sub-screen path is simply the request "pathInfo" (the remainder of the URL path after the location where the webapp/servlet are mounted).

The real magic of the Screen Facade is in the screen definition XML files. Each screen definition can specify web-settings, parameters, transitions with responses, subscreens, pre-render actions, render-time actions, and widgets. Widgets include subscreens menu/active/panel, sections, container, container-panel, render-mode-specific content (i.e. html, xml, csv, text, xsl-fo, etc), and forms.

There are two types of forms: form-single and form-list. They both have a variety of layout options and support a wide variety of field types. While Screen Forms are primarily defined in Screen XML files, they can also be extended for groups of users with the DbForm and related entities.

One important note about forms based on a service (using the auto-fields-service element) is that various client-side validations will be added automatically based on the validations defined for the service the form field corresponds to.

The output of the ScreenRender is created by running a template with macros for the various XML elements in screen and form definitions. If a template is specified through the ScreenRender.macroTemplate() method then it will be used, otherwise a template will be determined with the renderMode and the configuration in the screen-facade.screen-text-output element of the Moqui Conf XML file. You can create your own templates that override the default macros, or simply ignore them altogether, and configure them in the Moqui Conf XML file to get any output you want. There is an example of one such template in the runtime/template/screen-macro/ScreenHtmlMacros.ftl file, with the override configuration in the runtime/conf/development/MoquiDevConf.xml file.

The default HTML screen and form template uses jQuery Core and UI for dynamic client-side interactions. Other JS libraries could be used by modifying the screen HTML macros as described above, and by changing the theme data (defaults in runtime/component/webroot/data/WebrootThemeData.xml file) to point to the desired JavaScript and CSS files.

The Service Facade is used to call services through a number of service call interfaces for synchronous, asynchronous, scheduled and special (TX commit/rollback) service calls. Each interface has different methods to build up information about the call you want to do, and they have methods for the name and parameters of the service.

When a service is called the caller doesn’t need to know how it is implemented or where it is located. The service definition abstracts that out to the service definition so that those details are part of the implementation of the service, and not the calling of the service.

Service names are composed of 3 parts: path, verb, and noun. When referring to a service these are combined as: "${path}.${verb}#${noun}", where the hash/pound sign is optional but can be used to make sure the verb and noun match exactly. The path should be a Java package-style path such as org.moqui.impl.UserServices for the file at classpath://service/org/moqui/impl/UserServices.xml. While it is somewhat inconvenient to specify a path this makes it easier to organize services, find definitions based on a call to the service, and improve performance and caching since the framework can lazy-load service definitions as they are needed.

That service definition file will be found based on that path with location patterns: "classpath://service/$1" and "component://.*/service/$1" where $1 is the path with ‘.’ changed to ‘/’ and ".xml" appended to the end.

The verb (required) and noun (optional) parts of a service name are separate to better to describe what a service does and what it is acting on. When the service operates on a specific entity the noun should be the name of that entity.

The Service Facade supports CrUD operations based solely on entity definitions. To use these entity-implicit services use a service name with no path, a noun of create, update, or delete, a hash/pound sign, and the name of the entity. For example to update a UserAccount use the service name update#UserAccount. When defining entity-auto services the noun must also be the name of the entity, and the Service Facade will use the in- and out-parameters along with the entity definition to determine what to do (most helpful for create operations with primary/secondary sequenced IDs, etc).

The full service name combined from the examples in the paragraphs above would look like this:

org.moqui.impl.UserServices.update#UserAccount

When calling a service you can pass in any parameters you want, and the service caller will clean up the parameters based on the service definition (remove unknown parameters, convert types, etc) and validate parameters based on validation rules in the service definition before putting those parameters in the context for the service to run. When a service runs the parameters will be in the ec.context map along with other inherited context values, and will be in a map in the context called parameters to access the parameters segregated from the rest of the context.

One important validation is configured with the parameter.allow-html attribute in the service definition. By default no HTML is allowed, and you can use that attribute to allow any HTML or just safe HTML for the service parameter. Safe HTML is determined using the OWASP ESAPI and Antisamy libraries, and configuration for what is considered safe is done in the antisamy-esapi.xml file.

The Service Facade has a job scheduler configured using the ServiceJob entity. It uses standard java.util.concurrent classes including ThreadPoolExecutor and ScheduledThreadPoolExecutor for asynchronous and scheduled service calls from a single worker pool managed by the framework. There are screens in the System app for scheduling jobs, reviewing job history and results, and other job related administration.

For RPC web services the Service Facade uses Apache XML-RPC for incoming and outgoing XML-RPC service calls, and custom code using Moqui JSON and web request tools for incoming and outgoing JSON-RPC 2.0 calls. The outgoing calls are handled by the RemoteXmlRpcServiceRunner and RemoteJsonRpcServiceRunner classes, which are configured in the service-facade.service-type element in the Moqui Conf XML file. To add support for other outgoing service calls through the Service Facade implement the ServiceRunner interface (as those two classes do) and add a service-facade.service-type element for it.

Incoming web services are handled using default transitions defined in the runtime/component/webroot/screen/webroot/rpc.xml screen. The remote URL for these, if webroot.xml is mounted on the root ("/") of the server, would be something like: "http://hostname/rpc/xml" or "http://hostname/rpc/json". To handle other types of incoming services similar screen transitions can be added to the rpc.xml screen, or to any other screen.

The main tool for building a REST API based on internal services and entity operations is to define resource paths in a Service REST API XML file such as the moqui.rest.xml file in moqui-framework and the mantle.rest.xml file in mantle-usl. With your own Service REST API XML files you can define sets of web services to match the structure of the applications you are building, and grant authorization to different paths for different sets of users just like with XML Screens. In the Tools app you can view Service REST API details using automatic Swagger output produced by the framework based on the REST XML file and the entities and services used within it.

Another alternative for REST style services a screen transition can be declared with a HTTP request method (get, put, etc) as well as a name to match against the incoming URL. For more flexible support of parameters in the URL beyond the transition’s place in the URL path values following the transition can be configured to be treated the same as named parameters. To make things easier for JSON payloads they are also automatically mapped to parameters and can be treated just like parameters from any other source, allowing for easily reusable server-side code. To handle these REST service transitions an internal service can be called with very little configuration, providing for an efficient mapping between exposed REST services and internal services.

The Entity Facade is used for common database interactions including create/update/delete and find operations, and for more specialized operations such as loading and creating entity XML data files. While these operations are versatile and cover most of the database interactions needed in typical applications, sometimes you need lower-level access, and you can get a JDBC Connection object from the Entity Facade that is based on the entity-facade datasource configuration in the Moqui Conf XML file.

Entities correspond to tables in a database and are defined primarily in XML files. These definitions include list the fields on the entity, relationships betweens entities, special indexes, and so on. Entities can be extended using database record with the UserField and related entities.

Each individual record is represented by an instance of the EntityValue interface. This interface extends the Map interface for convenience, and has additional methods for getting special sets of values such as the primary key values. It also has methods for database interactions for that specific record including create, update, delete, and refresh, and for getting setting primary/secondary sequenced IDs, and for finding related records based on relationships in the entity definition. To create a new EntityValue object use the EntityFacade.makeValue() method, though most often you’ll get EntityValue instances through a find operation.

To find entity records use the EntityFind interface. To get an instance of this interface use the EntityFacade.makeFind() method. This find interface allows you to set various conditions for the find (both where and having, more convenience methods for where), specify fields to select and order by, set offset and limit values, and flags including use cache, for update, and distinct. Once options are set you can call methods to do the actual find including: one(), list(), iterator(), count(), updateAll(), and deleteAll().

The Entity Facade uses Atomikos TransactionsEssentials or Bitronix BTM (default) for XA-aware database connection pooling. To configure Atomikos use the jta.properties file. To configure Bitronix use the bitronix-default-config.properties file. With configuration in the entity-facade element of the Moqui Conf XML file you can change this to use any DataSource or XADataSource in JNDI instead.

The default database included with Moqui Framework is Apache Derby. This is easy to change with configuration in the entity-facade element of the Moqui Conf XML file. To add a database not yet supported in the MoquiDefaultConf.xml file, add a new database-list.database element. Currently databases supported by default include Apache Derby, DB2, HSQL, MySQL, Postgres, Oracle, and MS SQL Server.

The first time (in each run of Moqui) the Entity Facade does a database operation on an entity it will check to see if the table for that entity exists (unless configured not to). You can also configure it to check the tables for all entities on startup. If a table does not exist it will create the table, indexes, and foreign keys (for related tables that already exist) based on the entity definition. If a table for the entity does exist it will check the columns and add any that are missing, and can do the same for indexes and foreign keys.

Transactions are used mostly for services and screens. Service definitions have transaction settings, based on those the service callers will pause/resume and begin/commit/rollback transactions as needed. For screens a transaction is always begun for transitions (if one is not already in place), and for rendering actual screens a transaction is only begun if the screen is setup to do so (mostly for performance reasons).

You can also use the TransactionFacade for manual transaction demarcation. The JavaDoc comments have some code examples with recommended patterns for begin/commit/rollback and for pause/begin/ commit/rollback/resume to use try/catch/finally clauses to make sure the transaction is managed properly.

When debugging transaction problems, such as tracking down where a rollback-only was set, the TransactionFacade can also be use as it keeps a stack trace when setRollbackOnly() is called. It will automatically log this on later errors, and you can manually get those values at other times too.

By default the Transaction Facade uses the Bitronix TM library (also used for a connection pool by the Entity Facade). To configure Bitronix use the bitronix-default-config.properties file. Moqui also supports Atomikos OOTB. To configure Atomikos use the jta.properties file.

Any JTA transaction manager, such as one from an application server, can be used instead through JNDI by configuring the locations of the UserTransaction and TransactionManager implementations in the entity-facade element of the Moqui Conf XML file.

The Artifact Execution Facade is called by other facades to keep track of which artifacts are "run" in the life of the ExecutionContext. It keeps both a history of all artifacts, and a stack of the current artifacts being run. For example if a screen calls a subscreen and that calls a service which does a find on an entity the stack will have (bottom to top) the first screen, then the second screen, then the service and then the entity.

While useful for debugging and satisfying curiosity, the main purpose for keeping track of the stack of artifacts is for authorization and permissions. There are implicit permissions for screens, transitions, services and entities in Moqui Framework. Others may be added later, but these are the most important and the one supported for version 1.0 (see the "ArtifactType" Enumeration records in the SecurityTypeData.xml file for details).

The ArtifactAuthz* and ArtifactGroup* entities are used to configure authorization for users (or groups of users) to access specific artifacts. To simplify configuration authorization can be "inheritable" meaning that not only is the specific artifact authorized but also everything that it uses.

There are various examples of setting up different authorization patterns in the ExampleSecurityData.xml file. One common authorization pattern is to allow access to a screen and all of its subscreens where the screen is a higher-level screen such as the ExampleApp.xml screen that is the root screen for the example app. Another common pattern is that only a certain screen within an application is authorized but the rest of it is not. If a subscreen is authorized, even if its parent screen is not, the user will be able to use that subscreen.

There is also functionality to track performance data for artifact "hits". This is done by the Execution Context Factory instead of the Artifact Execution Facade because the Artifact Execution Facade is created for each Execution Context, and the artifact hit performance data needs to be tracked across a large number of artifact hits both concurrent and over a period of time. The data for artifact hits is persisted in the ArtifactHit and ArtifactHitBin entities. The ArtifactHit records are associated with the Visit record (one visit for each web session) so you can see a history of hits within a visit for auditing, user experience review, and various other purposes.

The User Facade is used to manage information about the current user and visit, and for login, authentication, and logout. User information includes locale, time zone, and currency. There is also the option to set an effective date/time for the user that the system will treat as the current date/time (through ec.user.nowTimestamp) instead of using the current system date/time.

The L10n (Localization) Facade uses the locale from the User Facade and localizes the message it receives using cached data from the LocalizedMessage entity. The EntityFacade also does localization of entity fields using the LocalizedEntityField entity. The L10n Facade also has methods for formatting currency amounts, and for parsing and formatting for Number, Timestamp, Date, Time, and Calendar objects using the Locale and TimeZone from the User Facade as needed.

The Message Facade is used to track messages and error messages for the user. The error message list (ec.message.errors) is also used to determine if there was an error in a service call or other action.

The Logger Facade is used to log information to the system log. This is meant for use in scripts and other generic logging. For more accurate and trackable logging code should use the SLF4J Logger class (org.slf4j.Logger) directly. The JavaDoc comments in the LoggerFacade interface include example code for doing this.

A Moqui Framework component is a set of artifacts that make up an application built on Moqui, or reusable artifacts meant to be used by other components such as the mantle-udm and mantle-usl components, a theme component, or a component that integrates some other tool or library with Moqui Framework to extend the potential range of applications based on Moqui.

The structure of a component is driven by convention as opposed to configuration. This means that you must use these particular directory names, and that all Moqui components you look at will be structured in the same way.

There are two ways to tell Moqui about a component:

Each webapp in Moqui (including the default webroot webapp) must have a root screen specified in the moqui-conf.webapp-list.webapp.root-screen-location attribute. The default root screen is called webroot which is located at runtime/component/webroot/screen/webroot.xml.

For screens from your component to be available in a screen path under the webroot screen you need to make each top-level screen in your component (i.e. each screen in the component’s screen directory) a subscreen of another screen that is an ancestor of the webroot screen. There are three ways to do this (this does not include putting it in the webroot directory as an implicit subscreen since that is not an option for screens defined elsewhere):

If you want your screen to use its own decoration and be independent from other screens, put it under the webroot screen directly. To have your screen part of the default apps menu structure and be decorated with the default apps decoration, put it under the apps screen.

You may want have things in your component add to or modify various things that come by default with Moqui Framework, including:

There are examples of all of these in the MoquiDefaultConf.xml file since the framework uses the Moqui Conf XML file for its own default configuration.

**Examples:**

Example 1 (unknown):
```unknown
java.util.concurrent
```

Example 2 (unknown):
```unknown
moqui.rest.xml
```

Example 3 (unknown):
```unknown
mantle.rest.xml
```

Example 4 (unknown):
```unknown
screen.subscreens.subscreen-item
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Introduction

**Contents:**
      - Wiki Spaces
      - Page Tree
- Introduction to Moqui Framework
- What is the Moqui Ecosystem?
- What is Moqui Framework?
- Moqui Concepts
  - Application Artifacts
  - The Execution Context
  - The Artifact Stack
  - Peeking Under the Covers

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

The Moqui Ecosystem is a set of software packages built on a common framework and universal business artifacts. The packages are organized as separate open source projects to keep their purpose, management, and dependencies focused and clean. All are managed with a moderated community model, much like the Linux Kernel.

The goal of the ecosystem is to provide a number of interoperating and yet competing enterprise applications, all based on a common framework for flexibility and easy customization, and a common set of business artifacts (data model and services) so they are implicitly integrated.

The ecosystem includes:

The focus of this book is Moqui Framework, and the last chapter is a summary of Mantle Business Artifacts.

Moqui Framework is an all-in-one, enterprise-ready application framework based on Groovy and Java. The framework includes tools for screens, services, entities, and advanced functionality based on them such as declarative artifact-aware security and multi-tenancy.

The Framework is well suited for a wide variety of applications from simple web sites (like moqui.org) and small form-based applications to complex ERP systems. Applications built with Moqui are easy to deploy on a wide variety of highly scalable infrastructure software such as Java Servlet containers (or app servers) and both traditional relational and more modern NoSQL databases.

Moqui Framework is based on a decade of experience with The Open For Business Project (now Apache OFBiz, see http://ofbiz.apache.org) and designed and written by the person who founded that project. Many of the ideas and approaches, including the pure relational data layer (no object-relational mapping) and the service-oriented logic layer, stem from this legacy and are present in Moqui in a more refined and organized form.

With a cleaner design, more straightforward implementation, and better use of other excellent open source libraries that did not exist when OFBiz was started in 2001, the Moqui Framework code is about 20% of the size of the OFBiz Framework while offering significantly more functionality and more advanced tools.

The result is a framework that helps you build applications that automatically handles many concerns that would otherwise require a significant percentage of overall effort for every application you build.

The Moqui Framework toolset is structured around artifacts that you can create to represent common parts of applications. In Moqui the term artifact refers to anything you create as a developer and includes various XML files as well as scripts and other code. The framework supports artifacts for things like:

Here is a table of common parts of an application and the artifact or part of an artifact that handles each:

The ExecutionContext is the central application-facing interface in the Moqui API. An instance is created specifically for executing edge artifacts such as a screen or service. The ExecutionContext, or "ec" for short, has various facade interfaces that expose functionality for the various tools in the framework.

The ec also keeps a context map that represents the variable space that each artifact runs in. This context map is a stack of maps and as each artifact is executed a fresh map is pushed onto the stack, then popped off it once the artifact is done executing. When reading from the map stack it starts at the top and goes down until it finds a matching map entry. When writing to the map stack it always writes to the map at the top of the stack (unless to explicitly reference the root map, i.e., at the bottom of the stack).

With this approach each artifact can run without concern of interfering with other artifacts, but still able to easily access data from parent artifacts (the chain of artifacts that called or included down to the current artifact). Because the ec is created for the execution of each edge artifact it has detailed information about every aspect of what is happening, including the user, messages from artifacts, and much more.

As each artifact is executed and includes or calls other artifacts the artifact is pushed onto a stack that keeps track of the active artifacts, and is added to an artifact history list tracking each artifact used.

As artifacts are pushed onto the stack authorization for each artifact is checked, and security information related to the artifact is tracked. With this approach authz settings can be simplified so that artifacts that include or call or artifacts can allow those artifacts to inherit authorization. With inherited authorization configurations are only needed for key screens and services that are accessed directly.

When working with Moqui Framework you’ll often be using higher-level artifacts such as XML files. These are designed to support most common needs and have the flexibility to drop down to lower level tools such as templates and scripts at any point. At some point though you’ll probably either get curious about what the framework is doing, or you’ll run into a problem that will be much easier to solve if you know exactly what is going on under the covers.

While service and entity definitions are handled through code other artifacts like XML Actions and the XML Screens and Forms are just transformed into other text using macros in FreeMarker template files. XML Actions are converted into a plain old Groovy script and then compiled into a class which is cached and executed. The visual (widget) parts of XML Screens and Forms are also just transformed into the specified output type (html, xml, xsl-fo, csv, text, etc) using a template for each type.

With this approach you can easily see the text that is generated along with the templates that produced the text, and through simple configuration you can even point to your own templates to modify or extent the OOTB functionality.

Moqui Framework is designed to facilitate implementation with natural concept mappings from design elements such as screen outlines and wireframes, screen flow diagrams, data statements, and automated process descriptions. Each of these sorts of design artifacts can be turned into a specific implementation artifact using the Moqui tools.

These design artifacts are usually best when based on requirements that define and structure specific activities that the system should support to interact with other actors including people and systems. These requirements should be distinct and separate from the designs to help drive design decisions and make sure that all important aspects of the system are considered and covered in the designs.

With this approach implementation artifacts can reference the designs they are based on, and in turn designs can reference the requirements they are based on. With implementation artifacts that naturally map to design artifacts both tasking and testing are straightforward.

When implementing artifacts based on such designs the order that artifacts are created is not so important. Different people can even work simultaneously on things like defining entities and building screens.

For web-based applications, especially public-facing ones that require custom artwork and design, the static artifacts such as images and CSS can be in separate files stored along with screen XML files using the same directory structure that is used for subscreens using a directory with the same name as the screen. Resources shared among many screens live naturally under screens higher up in the subscreen hierarchy.

The actual HTML generated from XML Screens and Forms can be customized by overriding or adding to the FreeMarker macros that are used to generate output for each XML element. Custom HTML can also be included as needed. This allows for easy visual customization of the generic HTML using CSS and JavaScript, or when needed totally custom HTML, CSS, and JavaScript to get any effect desired.

Web designers who work with HTML and CSS can look at the actual HTML generated and style using separate CSS and other static files. When more custom HTML is needed the web designers can produce the HTML that a developer can put in a template and parameterize as needed for dynamic elements.

Another option that sometimes works well is to have more advanced web designers build the entire client side as custom HTML, CSS, and JavaScript that interacts with the server through a service interface using some form of JSON over HTTP. This approach also works well with client applications for mobile or desktop devices that will interact with the application server using web services. The web services can use the automatic JSON-RPC or XML-RPC or other custom automatic mappings, or can use custom wrapper services that call internal services to support any sort of web service architecture.

However your team is structured and however work is to be divided on a given project, with artifacts designed to handle defined parts of applications it is easier to split up work and allow people to work in parallel based on defined interfaces.

For requirements and designs you need a group content collaboration tool that will be used by users and domain experts, analysts, designers, and developers. The collaboration tool should support:

There are various options for this sort of tool, though many do not support all the above and collaboration suffers because of it. One good commercial option is Atlassian Confluence. Atlassian offers a very affordable hosted solution for small groups along with various options for larger organizations. There are various open source options, including the wiki built into HiveMind PM which is based on Moqui Framework and Mantle Business Artifacts.

Note that this content collaboration tool is generally separate from your code repository, though putting requirement and design content in your code repository can work if everyone involved is able to use it effectively. Because Moqui itself can render wiki pages and pass through binary attachments you might even consider keeping this in a Moqui component. The main problem with this is that until there is a good wiki application built on Moqui to allow changing the content, this is very difficult for less technical people involved.

For the actual code repository there are various good options and this often depends on personal and organizational preferences. Moqui itself is hosted on GitHub and hosted private repositories on GitHub are very affordable (especially for a small number of repositories). If you do use GitHub it is easy to fork the moqui/moqui repository to maintain your own runtime directory in your private repository while keeping up to date with the changes in the main project code base.

Even if you don’t use GitHub a local or hosted git repository is a great way to manage source code for a development project. If you prefer other tools such as Subversion or Mercurial then there is no reason not to use them.

For actual coding purposes you’ll need an editor or IDE that supports the following types of files:

My preferred IDE these days is IntelliJ IDEA from JetBrains. The free Community Edition has excellent XML and Groovy support. For HTML, CSS, JavaScript, and FreeMarker to go beyond a simple text editor you’ll have to pay for the Ultimate Edition. I implemented most of Moqui, including the complex FreeMarker macro templates, using the Community Edition. After breaking down and buying a personal license for the Ultimate Edition I am happy with it, but the Community Edition is impressively capable.

Other popular Java IDEs like Eclipse and NetBeans are also great options and have built-in or plugin functionality to support all of these types of files. I personally prefer having autocomplete and other advanced IDE functionality around, but if you prefer a more simple text editor then of course use what makes you happy and productive.

The Moqui Framework itself is built using Gradle. While I prefer the command line version of Gradle (and Git), most IDEs (including IntelliJ IDEA) include decent user interfaces for these tools that help simplify common tasks.

A request from a Web Browser will find its way to the framework by way of the Servlet Container (the default is the embedded Jetty Servlet Container, also works well with Apache Tomcat and other Java Servlet implementations). The Servlet Container finds the requested path on the server in the standard way using the web.xml file and will find the MoquiServlet mounted there. The MoquiServlet is quite simple and just sets up an ExecutionContext, then renders the requested Screen.

The screen is rendered based on the configured "root" screen for the webapp, and the subscreens path to get down to the desired target screen. Beyond the path to the target screen there may be a transition name for a transition of that screen.

A transition is part of a screen definition and is used to go one from screen to another (or back to the same). Transitions are used to process input (not to prepare data for presentation), which is separated from the screen actions which are used to prepare data for presentation (not to process input).

If there is a transition name in the URL path the service or actions of the transition will be run, a response to the transition selected (based on conditions and whether there was an error), and then the response will be followed, usually to another screen.

When a service is called (often from a transition or screen action) the Service Facade validates and cleans up the input parameters to the service call using the defined input parameters on the service definition, and then calls the defined inline or external script, Java method, auto or implicit entity operation, or remote service.

Entity operations, which interact with the database, should only be called from services for write operations and can be called from actions anywhere for read operations (transition or screen actions, service scripts/methods, etc).

Web Service requests generally follow the same path as a form submission request from a web browser that is handled by a Screen Transition. The incoming data will be handled by the transition actions, and typically the response will be handled by an action that sends back the encoded response (in XML, JSON, etc) and the default-response for the transition will be of type "none" so that no screen is rendered and no redirecting to a screen is done.

Incoming email is handled through Email ECA rules which are called by the org.moqui.impl.EmailServices.poll#EmailServer service (configured using the EmailServer entity). These rules have information about the email received parsed and available to them in structured Maps. If the condition of a rule passes, then the actions of the rule will be run. Rules can be written to do anything you would like, typically saving the message somewhere, adding it to a queue for review based on content, generating an automated response, and so on.

Outgoing email is most easily done with a call to the org.moqui.impl.EmailServices.send#EmailTemplate service. This service uses the passed in emailTemplateId to lookup an EmailTemplate record that has settings for the email to render, including the subject, the from address, the XML Screen to render and use for the email body, screens or templates to render and attach, and various other options. This is meant to be used for all sorts of emails, especially notification messages and system-managed communication like customer service replies and such.

**Examples:**

Example 1 (unknown):
```unknown
org.moqui.impl.EmailServices.poll#EmailServer
```

Example 2 (unknown):
```unknown
org.moqui.impl.EmailServices.send#EmailTemplate
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Tool+and+Config+Overview

**Contents:**
      - Wiki Spaces
      - Page Tree
- Framework Tool and Configuration Overview
- Execution Context and Web Facade
  - Web Parameters Map
  - Factory, Servlet & Listeners
- Resource and Cache Facades
- Screen Facade
  - Screen Definition
  - Screen/Form Render Templates

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

What follows is a summary of the various tools in the Moqui Framework and corresponding configuration elements in the Moqui Conf XML file. The default settings are in the MoquiDefaultConf.xml file, which is included in the executable WAR file in a binary distribution of Moqui Framework. This is a great file to look at to see some of the settings that are available and what they are set to by default. If you downloaded a binary distribution of Moqui Framework you can view this file online at (note that this is from the master branch on GitHub and may differ slightly from the one you downloaded):

https://github.com/moqui/moqui-framework/blob/master/framework/src/main/resources/MoquiDefaultConf.xml

Any setting in this file can be overridden in the Moqui Conf XML file that is specified at runtime along with the runtime directory (and generally in the conf directory under the runtime directory). The two files are merged before any settings are used, with the runtime file overriding the default one. Because of this, one easy way to change settings is simply copy from the default conf file and paste into the runtime one, and then make changes as desired.

TODO: add framework tools diagram from old OmniGraffle file

The Execution Context is the central object in the Moqui Framework API. This object maintains state within the context of a single server interaction such as a web screen request or remote service call. Through the ExecutionContext object you have access to a number of "facades" that are used to access the functionality of different parts of the framework. There is detail below about each of these facades.

The main state tracked by the Execution Context is the variable space, or "context", used for screens, actions, services, scripts, and even entity and other operations. This context is a hash or map with name/value entries. It is implemented with the ContextStack class and supports protected variable spaces with push() and pop() methods that turn it into a stack of maps. As different artifacts are executed they automatically push() the context before writing to it, and then pop() the context to restore its state before finishing. Writing to the context always puts the values into the top of the stack, but when reading the named value is searched for at each level on the stack starting at the top so that fields in deeper levels are visible.

In some cases, such as calling a service, we want a fresh context to better isolate the artifact from whatever called it. For this we use the pushContext() method to get a fresh context, then the popContext() method after the artifact is run to restore the original context.

The context is the literal variable space for the executing artifact wherever possible. In screens when XML actions are executed the results go in the local context. Even Groovy scripts embedded in service and screen actions share a variable space and so variables declared exist in the context for subsequent artifacts.

Some common expressions you’ll see in Moqui-based code (using Groovy syntax) include:

For an ExecutionContext instance created as part of a web request (HttpServletRequest) there will be a special facade called the Web Facade. This facade is used to access information about the servlet environment for the context including request, response, session, and application (ServletContext). It is also used to access the state (attributes) of these various parts of the servlet environment including request parameters, request attributes, session attributes, and application attributes.

The request parameters "map" (ec.web.requestParameters) is a special map that contains parameters from the URL parameter string, inline URL parameters (using the "/~name=value/" format), and multi-part form submission parameters (when applicable). There is also a special parameters map (ec.web.parameters) that combines all the other maps in the following order (with later overriding earlier): request parameters, application attributes, session attributes, and request attributes. That parameters map is a stack of maps just like the context so if you write to it the values will go in the top of the stack which is the request attributes.

For security reasons the request parameters map is canonicalized and filtered. This and the Service Facade validation help to protect agains XSS and injection attacks.

Execution Context instances are created by the Execution Context Factory. This can be done directly by your code when needed, but is usually done by a container that Moqui Framework is running in.

The most common way to run Moqui Framework is as a webapp through either a WAR file deployed in a servlet container or app server, or by running the executable WAR file and using the embedded Jetty Servlet Container. In either case the Moqui root webapp is loaded and the WEB-INF/web.xml file tells the servlet container to load the MoquiServlet, the MoquiSessionListener, and the MoquiContextListener. These are default classes included in the framework, and you can certainly create your own if you want to change the lifecycle of the ExecutionContextFactory and ExecutionContext.

With these default classes the ExecutionContextFactory is created by the MoquiContextListener on the contextInitialized() event, and is destroyed by the same class on the contextDestroyed() event. The ExecutionContext is created using the factory by the MoquiServlet for each request in the doGet() and doPost() methods, and is destroyed by the MoquiServlet at the end of each request by the same method.

The Resource Facade is used to access and execute resource such as scripts, templates, and content. The Cache Facade is used to do general operations on caches, and to get a reference to a cache as an implementation of the Cache interface. Along with supporting basic get/put/remove/etc operations you can get statistics for each cache, and modify cache properties such as timeouts, size limit, and eviction algorithm. The default Cache Facade implementation is just a wrapper around ehcache, and beyond the cache-facade configuration in the Moqui Conf XML file you can configure additional options using the ehcache.xml file.

The Resource Facade uses the Cache Facade to cache plain text by its source location (for getLocationText() method), compiled Groovy and XML Actions scripts by their locations (for the runScriptInCurrentContext method), and compiled FreeMarker (FTL) templates also by location (for the renderTemplateInCurrentContext() method).

There is also a cache used for the small Groovy expressions that are scattered throughout XML Screen and Form definitions, and that cache is keyed by the actual text of the expression instead of by a location that it came from (for the evaluateCondition(), evaluateContextField(), and evaluateStringExpand() methods).

For more generic access to resources the getLocationReference() method returns an implementation of the ResourceReference interface. This can be used to read resource contents (for files and directories), and get information about them such as content/MIME type, last modified time, and whether it exists. These resource references are used by the rest of the framework to access resources in a generic and extensible way. Implementations of the ResourceReference interface can be implemented as needed and default implementations exist for the following protocols/schemes: http, https, file, ftp, jar, classpath, component, and content (JCR, i.e., Apache Jackrabbit).

The API of the Screen Facade is deceptively simple, mostly just acting as a factory for the ScreenRender interface implementation. Through the ScreenRender interface you can render screens in a variety of contexts, the most common being in a service with no dependence on a servlet container, or in response to a HttpServletRequest using the ScreenRender.render(request, response) convenience method.

Generally when rendering and a screen you will specify the root screen location, and optionally a subscreen path to specify which subscreens should be rendered (if the root screen has subscreens, and instead of the default-item for each screen with subscreens). For web requests this sub-screen path is simply the request "pathInfo" (the remainder of the URL path after the location where the webapp/servlet are mounted).

The real magic of the Screen Facade is in the screen definition XML files. Each screen definition can specify web-settings, parameters, transitions with responses, subscreens, pre-render actions, render-time actions, and widgets. Widgets include subscreens menu/active/panel, sections, container, container-panel, render-mode-specific content (i.e. html, xml, csv, text, xsl-fo, etc), and forms.

There are two types of forms: form-single and form-list. They both have a variety of layout options and support a wide variety of field types. While Screen Forms are primarily defined in Screen XML files, they can also be extended for groups of users with the DbForm and related entities.

One important note about forms based on a service (using the auto-fields-service element) is that various client-side validations will be added automatically based on the validations defined for the service the form field corresponds to.

The output of the ScreenRender is created by running a template with macros for the various XML elements in screen and form definitions. If a template is specified through the ScreenRender.macroTemplate() method then it will be used, otherwise a template will be determined with the renderMode and the configuration in the screen-facade.screen-text-output element of the Moqui Conf XML file. You can create your own templates that override the default macros, or simply ignore them altogether, and configure them in the Moqui Conf XML file to get any output you want. There is an example of one such template in the runtime/template/screen-macro/ScreenHtmlMacros.ftl file, with the override configuration in the runtime/conf/development/MoquiDevConf.xml file.

The default HTML screen and form template uses jQuery Core and UI for dynamic client-side interactions. Other JS libraries could be used by modifying the screen HTML macros as described above, and by changing the theme data (defaults in runtime/component/webroot/data/WebrootThemeData.xml file) to point to the desired JavaScript and CSS files.

The Service Facade is used to call services through a number of service call interfaces for synchronous, asynchronous, scheduled and special (TX commit/rollback) service calls. Each interface has different methods to build up information about the call you want to do, and they have methods for the name and parameters of the service.

When a service is called the caller doesn’t need to know how it is implemented or where it is located. The service definition abstracts that out to the service definition so that those details are part of the implementation of the service, and not the calling of the service.

Service names are composed of 3 parts: path, verb, and noun. When referring to a service these are combined as: "${path}.${verb}#${noun}", where the hash/pound sign is optional but can be used to make sure the verb and noun match exactly. The path should be a Java package-style path such as org.moqui.impl.UserServices for the file at classpath://service/org/moqui/impl/UserServices.xml. While it is somewhat inconvenient to specify a path this makes it easier to organize services, find definitions based on a call to the service, and improve performance and caching since the framework can lazy-load service definitions as they are needed.

That service definition file will be found based on that path with location patterns: "classpath://service/$1" and "component://.*/service/$1" where $1 is the path with ‘.’ changed to ‘/’ and ".xml" appended to the end.

The verb (required) and noun (optional) parts of a service name are separate to better to describe what a service does and what it is acting on. When the service operates on a specific entity the noun should be the name of that entity.

The Service Facade supports CrUD operations based solely on entity definitions. To use these entity-implicit services use a service name with no path, a noun of create, update, or delete, a hash/pound sign, and the name of the entity. For example to update a UserAccount use the service name update#UserAccount. When defining entity-auto services the noun must also be the name of the entity, and the Service Facade will use the in- and out-parameters along with the entity definition to determine what to do (most helpful for create operations with primary/secondary sequenced IDs, etc).

The full service name combined from the examples in the paragraphs above would look like this:

org.moqui.impl.UserServices.update#UserAccount

When calling a service you can pass in any parameters you want, and the service caller will clean up the parameters based on the service definition (remove unknown parameters, convert types, etc) and validate parameters based on validation rules in the service definition before putting those parameters in the context for the service to run. When a service runs the parameters will be in the ec.context map along with other inherited context values, and will be in a map in the context called parameters to access the parameters segregated from the rest of the context.

One important validation is configured with the parameter.allow-html attribute in the service definition. By default no HTML is allowed, and you can use that attribute to allow any HTML or just safe HTML for the service parameter. Safe HTML is determined using the OWASP ESAPI and Antisamy libraries, and configuration for what is considered safe is done in the antisamy-esapi.xml file.

The Service Facade has a job scheduler configured using the ServiceJob entity. It uses standard java.util.concurrent classes including ThreadPoolExecutor and ScheduledThreadPoolExecutor for asynchronous and scheduled service calls from a single worker pool managed by the framework. There are screens in the System app for scheduling jobs, reviewing job history and results, and other job related administration.

For RPC web services the Service Facade uses Apache XML-RPC for incoming and outgoing XML-RPC service calls, and custom code using Moqui JSON and web request tools for incoming and outgoing JSON-RPC 2.0 calls. The outgoing calls are handled by the RemoteXmlRpcServiceRunner and RemoteJsonRpcServiceRunner classes, which are configured in the service-facade.service-type element in the Moqui Conf XML file. To add support for other outgoing service calls through the Service Facade implement the ServiceRunner interface (as those two classes do) and add a service-facade.service-type element for it.

Incoming web services are handled using default transitions defined in the runtime/component/webroot/screen/webroot/rpc.xml screen. The remote URL for these, if webroot.xml is mounted on the root ("/") of the server, would be something like: "http://hostname/rpc/xml" or "http://hostname/rpc/json". To handle other types of incoming services similar screen transitions can be added to the rpc.xml screen, or to any other screen.

The main tool for building a REST API based on internal services and entity operations is to define resource paths in a Service REST API XML file such as the moqui.rest.xml file in moqui-framework and the mantle.rest.xml file in mantle-usl. With your own Service REST API XML files you can define sets of web services to match the structure of the applications you are building, and grant authorization to different paths for different sets of users just like with XML Screens. In the Tools app you can view Service REST API details using automatic Swagger output produced by the framework based on the REST XML file and the entities and services used within it.

Another alternative for REST style services a screen transition can be declared with a HTTP request method (get, put, etc) as well as a name to match against the incoming URL. For more flexible support of parameters in the URL beyond the transition’s place in the URL path values following the transition can be configured to be treated the same as named parameters. To make things easier for JSON payloads they are also automatically mapped to parameters and can be treated just like parameters from any other source, allowing for easily reusable server-side code. To handle these REST service transitions an internal service can be called with very little configuration, providing for an efficient mapping between exposed REST services and internal services.

The Entity Facade is used for common database interactions including create/update/delete and find operations, and for more specialized operations such as loading and creating entity XML data files. While these operations are versatile and cover most of the database interactions needed in typical applications, sometimes you need lower-level access, and you can get a JDBC Connection object from the Entity Facade that is based on the entity-facade datasource configuration in the Moqui Conf XML file.

Entities correspond to tables in a database and are defined primarily in XML files. These definitions include list the fields on the entity, relationships betweens entities, special indexes, and so on. Entities can be extended using database record with the UserField and related entities.

Each individual record is represented by an instance of the EntityValue interface. This interface extends the Map interface for convenience, and has additional methods for getting special sets of values such as the primary key values. It also has methods for database interactions for that specific record including create, update, delete, and refresh, and for getting setting primary/secondary sequenced IDs, and for finding related records based on relationships in the entity definition. To create a new EntityValue object use the EntityFacade.makeValue() method, though most often you’ll get EntityValue instances through a find operation.

To find entity records use the EntityFind interface. To get an instance of this interface use the EntityFacade.makeFind() method. This find interface allows you to set various conditions for the find (both where and having, more convenience methods for where), specify fields to select and order by, set offset and limit values, and flags including use cache, for update, and distinct. Once options are set you can call methods to do the actual find including: one(), list(), iterator(), count(), updateAll(), and deleteAll().

The Entity Facade uses Atomikos TransactionsEssentials or Bitronix BTM (default) for XA-aware database connection pooling. To configure Atomikos use the jta.properties file. To configure Bitronix use the bitronix-default-config.properties file. With configuration in the entity-facade element of the Moqui Conf XML file you can change this to use any DataSource or XADataSource in JNDI instead.

The default database included with Moqui Framework is Apache Derby. This is easy to change with configuration in the entity-facade element of the Moqui Conf XML file. To add a database not yet supported in the MoquiDefaultConf.xml file, add a new database-list.database element. Currently databases supported by default include Apache Derby, DB2, HSQL, MySQL, Postgres, Oracle, and MS SQL Server.

The first time (in each run of Moqui) the Entity Facade does a database operation on an entity it will check to see if the table for that entity exists (unless configured not to). You can also configure it to check the tables for all entities on startup. If a table does not exist it will create the table, indexes, and foreign keys (for related tables that already exist) based on the entity definition. If a table for the entity does exist it will check the columns and add any that are missing, and can do the same for indexes and foreign keys.

Transactions are used mostly for services and screens. Service definitions have transaction settings, based on those the service callers will pause/resume and begin/commit/rollback transactions as needed. For screens a transaction is always begun for transitions (if one is not already in place), and for rendering actual screens a transaction is only begun if the screen is setup to do so (mostly for performance reasons).

You can also use the TransactionFacade for manual transaction demarcation. The JavaDoc comments have some code examples with recommended patterns for begin/commit/rollback and for pause/begin/ commit/rollback/resume to use try/catch/finally clauses to make sure the transaction is managed properly.

When debugging transaction problems, such as tracking down where a rollback-only was set, the TransactionFacade can also be use as it keeps a stack trace when setRollbackOnly() is called. It will automatically log this on later errors, and you can manually get those values at other times too.

By default the Transaction Facade uses the Bitronix TM library (also used for a connection pool by the Entity Facade). To configure Bitronix use the bitronix-default-config.properties file. Moqui also supports Atomikos OOTB. To configure Atomikos use the jta.properties file.

Any JTA transaction manager, such as one from an application server, can be used instead through JNDI by configuring the locations of the UserTransaction and TransactionManager implementations in the entity-facade element of the Moqui Conf XML file.

The Artifact Execution Facade is called by other facades to keep track of which artifacts are "run" in the life of the ExecutionContext. It keeps both a history of all artifacts, and a stack of the current artifacts being run. For example if a screen calls a subscreen and that calls a service which does a find on an entity the stack will have (bottom to top) the first screen, then the second screen, then the service and then the entity.

While useful for debugging and satisfying curiosity, the main purpose for keeping track of the stack of artifacts is for authorization and permissions. There are implicit permissions for screens, transitions, services and entities in Moqui Framework. Others may be added later, but these are the most important and the one supported for version 1.0 (see the "ArtifactType" Enumeration records in the SecurityTypeData.xml file for details).

The ArtifactAuthz* and ArtifactGroup* entities are used to configure authorization for users (or groups of users) to access specific artifacts. To simplify configuration authorization can be "inheritable" meaning that not only is the specific artifact authorized but also everything that it uses.

There are various examples of setting up different authorization patterns in the ExampleSecurityData.xml file. One common authorization pattern is to allow access to a screen and all of its subscreens where the screen is a higher-level screen such as the ExampleApp.xml screen that is the root screen for the example app. Another common pattern is that only a certain screen within an application is authorized but the rest of it is not. If a subscreen is authorized, even if its parent screen is not, the user will be able to use that subscreen.

There is also functionality to track performance data for artifact "hits". This is done by the Execution Context Factory instead of the Artifact Execution Facade because the Artifact Execution Facade is created for each Execution Context, and the artifact hit performance data needs to be tracked across a large number of artifact hits both concurrent and over a period of time. The data for artifact hits is persisted in the ArtifactHit and ArtifactHitBin entities. The ArtifactHit records are associated with the Visit record (one visit for each web session) so you can see a history of hits within a visit for auditing, user experience review, and various other purposes.

The User Facade is used to manage information about the current user and visit, and for login, authentication, and logout. User information includes locale, time zone, and currency. There is also the option to set an effective date/time for the user that the system will treat as the current date/time (through ec.user.nowTimestamp) instead of using the current system date/time.

The L10n (Localization) Facade uses the locale from the User Facade and localizes the message it receives using cached data from the LocalizedMessage entity. The EntityFacade also does localization of entity fields using the LocalizedEntityField entity. The L10n Facade also has methods for formatting currency amounts, and for parsing and formatting for Number, Timestamp, Date, Time, and Calendar objects using the Locale and TimeZone from the User Facade as needed.

The Message Facade is used to track messages and error messages for the user. The error message list (ec.message.errors) is also used to determine if there was an error in a service call or other action.

The Logger Facade is used to log information to the system log. This is meant for use in scripts and other generic logging. For more accurate and trackable logging code should use the SLF4J Logger class (org.slf4j.Logger) directly. The JavaDoc comments in the LoggerFacade interface include example code for doing this.

A Moqui Framework component is a set of artifacts that make up an application built on Moqui, or reusable artifacts meant to be used by other components such as the mantle-udm and mantle-usl components, a theme component, or a component that integrates some other tool or library with Moqui Framework to extend the potential range of applications based on Moqui.

The structure of a component is driven by convention as opposed to configuration. This means that you must use these particular directory names, and that all Moqui components you look at will be structured in the same way.

There are two ways to tell Moqui about a component:

Each webapp in Moqui (including the default webroot webapp) must have a root screen specified in the moqui-conf.webapp-list.webapp.root-screen-location attribute. The default root screen is called webroot which is located at runtime/component/webroot/screen/webroot.xml.

For screens from your component to be available in a screen path under the webroot screen you need to make each top-level screen in your component (i.e. each screen in the component’s screen directory) a subscreen of another screen that is an ancestor of the webroot screen. There are three ways to do this (this does not include putting it in the webroot directory as an implicit subscreen since that is not an option for screens defined elsewhere):

If you want your screen to use its own decoration and be independent from other screens, put it under the webroot screen directly. To have your screen part of the default apps menu structure and be decorated with the default apps decoration, put it under the apps screen.

You may want have things in your component add to or modify various things that come by default with Moqui Framework, including:

There are examples of all of these in the MoquiDefaultConf.xml file since the framework uses the Moqui Conf XML file for its own default configuration.

**Examples:**

Example 1 (unknown):
```unknown
java.util.concurrent
```

Example 2 (unknown):
```unknown
moqui.rest.xml
```

Example 3 (unknown):
```unknown
mantle.rest.xml
```

Example 4 (unknown):
```unknown
screen.subscreens.subscreen-item
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Quick+Tutorial

**Contents:**
      - Wiki Spaces
      - Page Tree
- Moqui Framework Quick Tutorial
- Overview
- Part 1
  - Download Moqui Framework
  - Create a Component
  - Add a Screen
  - Mount as a Subscreen
  - Try Included Content

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

This tutorial is a step-by-step guide to creating and running your own Moqui component with a user interface, logic, and database interaction.

Part 1: To get started you'll be creating your own component and a simple "Hello world!" screen.

Part 2: Continuing from there you'll define your own entity (database table) and add forms to your screen to find and create records for that entity.

Part 3: To finish off the fun you will create some custom logic instead of using the default CrUD logic performed by the framework based on the entity definition.

The running approach used in this document is a simple one using the embedded servlet container. For more complete coverage of running and deployment options, and of the general directory structure of Moqui Framework, please read the Run and Deploy document.

If you haven't already downloaded Moqui Framework, do that now.

Run Moqui using the Running and Deployment Instructions.

In your browser go to http://localhost:8080/, log in as John Doe, and look around a bit.

Now quit (<ctrl>-c in the command line) and you're ready to go...

Moqui follows the "convention over code" principle for components, so all you really have to do to create a Moqui component is create a directory:

$ cd runtime/component$ mkdir tutorial

Now go into the directory and create some of the standard directories that you'll use later in this tutorial:

$ cd tutorial$ mkdir data$ mkdir entity$ mkdir screen$ mkdir script$ mkdir service

Using your favorite IDE or text editor add a screen XML file in:

runtime/component/tutorial/screen/tutorial.xml

For now let this be a super simple screen with just a "Hello world!" label in it. The contents should look something like:

Note that the screen.@require-authentication attribute is set to "anonymous-all". This effectively disables the default security settings of screens where both authentication (login) and authorization to access the screen are required. The apps.xml screen uses the "false" setting for this attribute which is similar but does not login an 'anonymous' user or disable authorization for 'all' (not just view) actions on the screen.

For more information on Moqui Artifact Authorization see the Security document.

Another thing to notice is the xmlns:xsi and xsi:noNamespaceSchemaLocation attribute which are used to specify the XSD file to use for validation and auto-completion in your IDE. Depending on your IDE you may need to go through different steps to configure it so that it knows how to find the local XSD file for the location specified (it is a valid HTTP URL but that's not how XSD URIs work). See the documents under the IDE Setup document.

To make your screen available it needs to be added as a subscreen to a screen that is already under the root screen somewhere. In Moqui screens the URL path to the screen and the menu structure are both driven by the subscreen hierarchy, so this will setup the URL for the screen and add a menu tab for it.

For the purposes of this tutorial we'll use the existing root screen and header/footer/etc that are in the included runtime directory. This runtime directory has a webroot component with the root screen at:

runtime/base-component/webroot/screen/webroot.xml

On a side note, the root screen is specified in the Moqui Conf XML file using the webapp-list.webapp.root-screen element, and you can have multiple elements to have different root screens for different host names. See the Run and Deploy guide for more information on the Moqui Conf XML file.

To make the screen hierarchy more flexible this root screen only has a basic HTML head and body, with no header and footer content, so let's put our screen under the apps screen which adds a header menu and will give our screen some context.

There are 4 ways to make a screen a subscreen of another screen described in the User Interface => XML Screen document. For this tutorial we'll use the component MoquiConf.xml file approach which is merged into the MoquiDefaultConf.xml file included in the framework when Moqui starts along with MoquiConf.xml files in other components and the runtime Moqui Conf XML file optionally specified in a startup command line argument. This is the recommended approach for adding a new 'app' to Moqui and is used in PopCommerce, HiveMind, etc.

Add a MoquiConf.xml file to the root directory of your component:

runtime/component/tutorial/MoquiConf.xml

While you can include anything supported in the Moqui Conf XML file to mount a subscreen we'll just use the screen-facade.screen element like:

With your component in place just start up Moqui (with java -jar moqui.war or the like).

The subscreens-item.name attribute specifies the value for the path in the URL to the screen, so your screen is now available in your browser at:

http://localhost:8080/apps/tutorial

It is also available in the new Vue JS based hybrid server + client application wrapper under /vapps which uses the screens mounted under /apps:

http://localhost:8080/vapps/tutorial

Instead of using the label element we can get the HTML from a file that is "under" the screen.

First create a simple HTML file located in a tutorial directory under our component's screen directory:

runtime/component/tutorial/screen/tutorial/hello.html

The HTML file can contain any HTML, and since this will be included in a screen whose parent screens take care of header/footer/etc we can keep it very simple:

Now just explicitly include the HTML file in the tutorial.xml screen definition using a render-mode.text element just after the label element from the first version of this file above. The full file should now look like:

So what is this render-mode thingy? Moqui XML Screens are meant to platform agnostic and may be rendered in various environments. Because of this we don't want anything in the screen that is specific to a certain mode of rendering the screen without making it clear that it is. Under the render-mode element you can have various sub-elements for different render modes, even for different text modes such as HTML, XML, XSL-FO, CSV, and so on so that a single screen definition can be rendered in different modes and produce output as needed for each mode.

Since Moqui 2.1.0 the Vue JS based hybrid client/server rendering functionality is available. This uses the render mode 'vuet' instead of 'html' because the output is actually a Vue template and not standard HTML. The text.@type attribute is "html,vuet" so that the HTML from the file is included for both render modes.

The screen is available at the same URL, but now includes the content from the HTML file instead of just having it inline as a label in the screen definition.

One side effect of putting the hello.html file under a mounted screen using the matching directory name (tutorial for tutorial.xml) is that this file is also available for direct access with a URL like:

http://localhost:8080/apps/tutorial/hello.html

When you go to this URL you won't see the header from the apps.xml screen because it is directly accessing the file. This is can be used for other static (not server rendered) text files like CSS, JavaScript, and even binary files like images. Typically it's best to use a separate parent screen for static content as the SimpleScreens and HiveMind do, but it can be mixed with screens in any screen hierarchy.

What if you don't want the raw HTML from hello.html to be available through an HTTP request? What if you only want it to be usable as an include in a screen? To do that just don't put it in a directory that isn't under a mounted screen. A common approach to this is to add a template directory to your component and put the templates and files there. For example:

runtime/component/tutorial/template/tutorial/hello.html

With hello.html in that directory the location you specify to include it in the screen also changes, like:

An entity is a basic tabular data structure, and usually just a table in a database. An entity value is equivalent to a row in the database. Moqui does not do object-relational mapping, so all we have to do is define an entity, and then start writing code using the Entity Facade (or other higher level tools) to use it.

To create a simple entity called "Tutorial" with fields "tutorialId" and "description" create an entity XML file at:

runtime/component/tutorial/entity/TutorialEntities.xml

Add an entity definition to that file like:

If you're running Moqui in dev mode the entity definition cache clears automatically so you don't have to restart, and for production mode or if you don't want to wait (since Moqui does start very fast) you can just stop and start the JVM.

How do you create the table in the database? When running with the embedded H2 database Moqui can create tables on the fly and will do so the first time to use the new entity. This used to also work with MySQL but due to transactional handling of create table it no longer does. Creating a table and other DB meta data operations are usually not allowed in the middle of an active transaction so it must be done in advance and for most databases Moqui Framework does adds missing tables, columns, foreign keys, and indexes only on startup (which can also be turned off by configuration or env var).

The Entity Facade has functionality to load data from, and write data to, XML files that basically elements that match entity names and attributes that map field names.

We'll create a UI to enter data later on, and you can use the Auto Screens or Entity Data Import screen in the Tools application to work with records in your new entity. Data files are useful for seed data that code depends on, data for testing, and data to demonstrate how a data model should be used. So, let's try it.

Create an Entity Facade XML data file at:

runtime/component/tutorial/data/TutorialDemoData.xml

In the file add an entity-facade-xml element with sub-elements for the full entity name which is the package and the entity-name together (tutorial.Tutorial):

Note that the type attribute is set to "demo". This is used when running a general data load (java -jar moqui.war load) where limited data file types may be specified to load. You can use any simple text for the data file type but there are a few standard types used in the framework such as seed, seed-initial, install, demo, and test.

The standard set of types to load on production instances is seed, seed-initial, and install. The demo type is used for demo data used during development and testing. The test type is for file that overwrite production settings stored in the database so that clones of a production database are safer to use for end user experimenting or developer testing and gets loaded automatically when Moqui starts if the instance_purpose is set to "test".

For more information on data loading see the Data and Resources => Entity Data Import and Export document.

The easiest way to load this is from the Data Import screen in the Tools app:

http://localhost:8080/vapps/tools/Entity/DataImport

Click on the XML Text section of the form, paste in the XML above, then click on the Import Data - Create Only button. You can also click on the Import Data - Create or Update button but because we know these records aren't already there we can use the Create Only variation which is intended for loading data on production servers where you don't want to replace existing records that may have been modified.

To load this from the command line, with Moqui not already running, just run $ ./gradlew load or one of the other load variations described in the Run and Deploy document.

We're about to add a sub-screen under our tutorial.xml screen but so far it doesn't do anything with sub-screens. We need to tell the framework where in the widgets to include the active sub-screen and we do that by adding a subscreens-active element.

For good measure it is best to always have a default sub-screen for each screen that supports sub-screens so that any partial URL still goes somewhere useful. That is done using the subscreens.@default-item attribute which we'll set to "FindTutorial" to match the name of the screen we're about to add.

While we're at it let's make our new application secure and add authorization configuration so it is accessible. To make it secure just remove the screen.@require-authentication attribute.

With those changes our tutorial.xml screen should now look like:

With the subscreens-active element below the label and render-mode elements from our previous screen the tutorial.xml screen is now a wrapper around all sub-screens so the "Hello world!" text gets displayed above the sub-screen widgets.

To configure authorization we'll need some data in the database, and we'll put it in a file for future reference even though for now it is easiest to just load through the Data Import screen in the Tools app as we did above. Create a new data XML file at:

runtime/component/tutorial/data/TutorialSetupData.xml

In the file we'll need 3 records:

Note that we're using the ALL_USERS group in this example. This group is a special one in the framework that all users are automatically a member of. That makes it different from any other group, like the OOTB ADMIN group which only includes members for records in the UserGroupMember entity.

Load this data now thought the Data Import screen in the Tools app so that it is in place when we try our new find screen below.

Now we have a more complete shell for our new application and we're ready to add a find screen.

Add the XML screen definition below as a sub-screen of the tutorial.xml screen by putting it in a file at:

runtime/component/tutorial/screen/tutorial/FindTutorial.xml

This uses the Directory Structure approach for adding sub-screens described in the User Interface => XML Screen document.

This screen has a couple of key parts:

To view this screen use this URL:

http://localhost:8080/vapps/tutorial/FindTutorial

Instead of the default for the description field, what if you wanted to specify how it should look at what type of field it should be?

To do this just add a field element inside the form-list element, and just after the auto-fields-entity element, like this:

Because the field name attribute is the same as a field already created by the auto-fields-entity element it will override that field. If the name was different an additional field would be created. The result of this is basically the same as what was automatically generated using the auto-fields-entity element except that the options are hidden for the text-find field (inspect it in your browser to see that other find parameters are still there with default options, ie this is different from a plain text-line).

Let's add a button that will pop up a Create Tutorial form, and a transition to process the input.

Think of links between screens as an ordered graph where each screen is a node and the transitions defined in each screen are how you go from that screen to another (or back to the same), and as part of that transition optionally run server-side actions or a service. A single transition can have multiple responses with conditions and for errors resulting in transition to various screens as needed by your UI design.

First add a transition to the FindTutorial.xml screen you created before, just above the actions element:

This transition calls the create#tutorial.Tutorial service, and then goes back to the current screen.

Where did the create#tutorial.Tutorial service come from? We haven't defined anything like that yet. The Moqui Service Facade supports a special kind of service for entity CrUD operations that don't need to be defined, let alone implemented. This service name consists of two parts, a verb and a noun, separated by a hash (#). As long as the verb is create, update, store, or delete and the noun is a valid entity name the Service Facade will treat it as an implicit entity-auto service and do the desired operation. It does so based on the entity definition and the parameters passed to the service call. For example, with the create verb and an entity with a single primary key field if you pass in a value for that field it will use it, otherwise it will automatically sequence a value using the entity name as the sequence key.

Next let's add the create form, in a hidden container that will expand when a button is clicked. Put this inside the widget element, just above the form-list element in the original FindTutorial.xml screen you created before so that it appears above the list form in the screen:

The form definition refers to the transition you just added to the screen, and uses the auto-fields-entity element with edit for the field-type to generate edit fields. The last little detail is to declare a button to submit the form, and it's ready to go.

Try it out and see the records appear in the list form that was part of the original screen.

The createTutorial transition from our screen above used the implicit entity-auto service create#tutorial.Tutorial. Let's see what it would look like to define and implement a service manually.

First lets define a service and use the automatic entity CrUD implementation:

runtime/component/tutorial/service/tutorial/TutorialServices.xml

This will allow all fields of the Tutorial entity to be passed in, including an optional tutorialId which is the primary key field and a sequenced ID will be generated no value is specified. It will always return the PK field (tutorialId). Note that with the auto-parameters element we are defining the service based on the entity, and if we added fields to the entity they would be automatically represented in the service.

One quirk with service.@type set to "entity-auto" is that it uses the service.@noun for the entity name. It works like this without the entity package included in the name because the framework allows using entity names without a package, though you may be inconsistent results if there are multiple entities with the same name in different packages.

Now change that service definition to add an inline implementation as well. Notice that the service.@type attribute has changed, and the actions element has been added.

Now to call the service instead of the implicit entity-auto one just change the transition to refer to this service:

Note that the service name for a defined service like this is like a fully qualified Java class name. It has a "package", in this case "tutorial", which is the directory (and may be a path with multiple directories separated by dots) under the component/service directory. Then there is a dot and the equivalent of the class name, in this case "TutorialServices" which is the name of the XML file the service is in, but without the .xml extension. After that is another dot, and then the service name with the verb and noun optionally separated by a hash (#).

What if you want to implement the service in Groovy (or some other supported scripting language) instead of the inline XML Actions? Try adding another service definition like this to the TutorialServices.xml file (to test change the service name in FindTutorial.xml):

Notice that the service.@type attribute has changed to script, and there is now a service.@location attribute which specifies the location of the script.

Because we've change the service.@noun attribute to "TutorialGroovy" which is not a valid entity name we must specify the entity-name on the two auto-parameters elements. In other words by default it you don't specify auto-parameters.@entity-name the framework will try the service.@noun and in this case that will result in an error.

The script can be located anywhere in the component as we refer to it's location explicitly. For convenience we're adding it to the existing service/tutorial directory. Here is what the script would look like in that location:

When in Groovy, or other languages, you'll be using the Moqui Java API which is based on the ExecutionContext class which is available in the script with the variable name "ec". For more details on the API see the API JavaDocs and specifically the doc for the ExecutionContext class which has links to the other major API interface pages.

Now that you have soiled your hands with the details of Moqui Framework you're ready to explore the other documentation here in the Moqui Framework wiki space on moqui.org. Most of the content from the "Making Apps with Moqui" book has been migrated here and updated for changes and new functionality in the framework.

There is also documentation for Mantle Business Artifacts, including the UDM data model, available here on moqui.org.

If you will be doing any ERP related development the documentation for the POPC ERP app is highly recommended for both reading and reference to better understand business concepts and how end users go about doing various business activities in the app. This is also useful to find services to use by looking at how things are meant to be done in the ERP app and then looking at the transitions in the screens to see which services are used.

You may also enjoy reading through the Framework Features document.

**Examples:**

Example 1 (unknown):
```unknown
<?xml version="1.0" encoding="UTF-8"?>
<screen xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/xml-screen-2.1.xsd"
        require-authentication="anonymous-all">
    <widgets>
        <label type="h1" text="Hello world!"/>
    </widgets>
</screen>
```

Example 2 (unknown):
```unknown
<?xml version="1.0" encoding="UTF-8"?>
<screen xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/xml-screen-2.1.xsd"
        require-authentication="anonymous-all">
    <widgets>
        <label type="h1" text="Hello world!"/>
    </widgets>
</screen>
```

Example 3 (unknown):
```unknown
<?xml version="1.0" encoding="UTF-8" ?>
<moqui-conf xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/moqui-conf-2.1.xsd">
    <screen-facade>
        <screen location="component://webroot/screen/webroot/apps.xml">
            <subscreens-item name="tutorial" menu-title="Tutorial" menu-index="99"
                    location="component://tutorial/screen/tutorial.xml"/>
        </screen>
    </screen-facade>
</moqui-conf>
```

Example 4 (unknown):
```unknown
<?xml version="1.0" encoding="UTF-8" ?>
<moqui-conf xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/moqui-conf-2.1.xsd">
    <screen-facade>
        <screen location="component://webroot/screen/webroot/apps.xml">
            <subscreens-item name="tutorial" menu-title="Tutorial" menu-index="99"
                    location="component://tutorial/screen/tutorial.xml"/>
        </screen>
    </screen-facade>
</moqui-conf>
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/docs/framework/IDE+Setup

**Contents:**
      - Wiki Spaces
      - Page Tree
- IDE Setup

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

See pages below this page for information about setting up and working with Moqui in various IDEs.

---
