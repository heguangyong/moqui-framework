# Moqui_Complete - Framework

**Pages:** 50

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/The+Tools+Application/Entity+Tools

**Contents:**
      - Wiki Spaces
      - Page Tree
- Entity Tools
- Data Edit
- Data Export
- Data Import
- SQL Runner
- Speed Test
- Query Stats
- Data Snapshots

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

The data edit screens are somewhat similar to the Auto Screens, but without the tab sets and instead on the entity edit screen a list of related entities with a link to find records related to the current record, as you can see here. These screens still have their uses but are mostly superseded by the Auto Screens.

This screen is used to export entity data in one or more entity XML files, or out to the browser. Select one or more entity names, from/thru dates to filter by the lastUpdatedStamp, the output path or filename (leave empty for Out to Browser), an optional Map in Groovy syntax to filter by (filter fields only applied to entities with matching field names, otherwise ignored), and optional comma-separated order by field names (also only applies to entities with matching field names).

Use this screen to import data from entity XML, JSON or CSV text. There are 3 options for the text itself: comma-separated data types (matching the entity-facade-xml.type attribute), a resource location that can be a local filename or any location supported by the Resource Facade, or text pasted right into the browser in a textarea. Dummy FKs checks each record’s foreign keys and if a record doesn’t exist adds one with only PK fields populated. Use Try Insert is meant for data that is expected to not exist and instead of querying each record to see if it does it just tries an insert and if that fails does an update (slower for lots of updates). Check Only doesn’t actually load the data and instead checks each record and reports the differences.

Use this screen to run arbitrary SQL statements against the database for a given entity group and view the results.

This screen runs a series of cache and entity operations to report timing results. It is most useful to see comparative performance between different databases and server configurations. The screen accepts a baseCalls parameter which defaults to 1000 (as seen below). Note that this screen shot uses the default configuration with the "nosql" entity group in the Derby database along with all the others. When using OrientDB or some other NoSQL datasource you’ll see fairly different results.

This screen is used to show the statistics for queries run since server start. All times are in microseconds..

This Screen used to export, import and upload data snapshots. It is also used for create and drop Foreign keys.

The recommended approach to load a full database snapshot (as of Moqui 3) is:

**Examples:**

Example 1 (unknown):
```unknown
# start with a fresh local build or clean local H2 and ElasticSearch data
$ gradle cleanDb
# load file by location in raw mode - location is absolute path or relative to runtime directory - creates tables but no FKs, no feed to ElasticSearch
$ java -jar moqui.war load raw location=db/snapshot/MoquiSnapshot20200223-1258.zip
# start moqui normally, will see ElasticSearch indexes don't exist so triggers the feeds with indexOnStartEmpty="Y", OOTB just MantleSearch DataFeed in mantle-usl
$ java -jar moqui.war
# Foreign Keys are still missing so go to /vapps/tools/Entity/DataSnapshot and run 'Create FKs'
```

Example 2 (unknown):
```unknown
# start with a fresh local build or clean local H2 and ElasticSearch data
$ gradle cleanDb
# load file by location in raw mode - location is absolute path or relative to runtime directory - creates tables but no FKs, no feed to ElasticSearch
$ java -jar moqui.war load raw location=db/snapshot/MoquiSnapshot20200223-1258.zip
# start moqui normally, will see ElasticSearch indexes don't exist so triggers the feeds with indexOnStartEmpty="Y", OOTB just MantleSearch DataFeed in mantle-usl
$ java -jar moqui.war
# Foreign Keys are still missing so go to /vapps/tools/Entity/DataSnapshot and run 'Create FKs'
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/User+Interface/Notification+and+WebSocket

**Contents:**
      - Wiki Spaces
      - Page Tree
- Notification and WebSocket
- NotificationMessage (server side)
  - NotificationTopic Entity
  - NotificationMessageListener
  - Code References
- NotificationClient (JS client side)
  - Code References

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

The Notification functionality in Moqui Framework is a user and topic based publish/subscribe tool that can be used to push notifications to server code by direct topic subscription or client applications by WebSocket. Other interfaces for client applications could be built for anything you'd like but the current OOTB implementation for this is WebSocket based and meant for notifications, screen pops, etc in web-based client applications.

The NotificationMessage interface in the Moqui Framework API is the primary object for generating notifications for one or more users and with a specific topic. The topic for a Notification is an arbitrary string identifier to distinguish different types of messages so that listeners (server side or client side) can listen for just the topics they know how to handle.

To generate a message first use the ExecutionContext.makeNotificationMessage() method which returns a NotificationMessage object. On that object call methods as needed to set the topic, title, type (info, success, warning, danger), message (Map or JSON body), and specify the user(s) and/or user groups that should receive the notification. For example:

In this example a notification is sent to all users (via the Moqui automatic 'ALL_USERS' userGroupId) with the topic "TestTopic" and a message body in a Map or String object called 'messageMapOrJsonString'.

TODO: reference for all methods on NotificationMessage interface

TODO general description, use to configure defaults for a topic as alternative to setting options in code

TODO: reference for all fields on NotificationTopic entity

TODO ec.factory.registerNotificationMessageListener()

ExecutionContext NotificationMessage NotificationMessageImpl NotificationMessageListener

TODO general description and how it works

TODO example JavaScript to use for displaying a growl style notification TODO example JavaScript to use for custom client handling (screen pop, modify state, etc)

MoquiLib.js WebrootVue.js NotificationWebSocketListener NotificationEndpoint

**Examples:**

Example 1 (unknown):
```unknown
ec.makeNotificationMessage().topic("TestTopic").type("info").title("Test notification message")
        .message(messageMapOrJsonString).userGroupId("ALL_USERS").send()
```

Example 2 (unknown):
```unknown
ec.makeNotificationMessage().topic("TestTopic").type("info").title("Test notification message")
        .message(messageMapOrJsonString).userGroupId("ALL_USERS").send()
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Logic+and+Services/Service+Implementation

**Contents:**
      - Wiki Spaces
      - Page Tree
- Service Implementation
- Service Scripts
  - Inline Actions
- Java Methods
- Entity Auto Services
- Add Your Own Service Runner

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

Some service types have local implementations while others have no implementation (interface) or the service definition is a proxy for something else and the location refers to an external implementation (remote-xml-rpc,* remote-json-rpc*, and camel). The remote and Apache Camel types are described in detail in the System Interfaces section.

A script is generally the best way to implement a service, unless an automatic implementation for entity CrUD operations will do. Scripts are reloaded automatically when their cache entry is clear, and in development mode these caches expire in a short time by default to get updates automatically.

Scripts can run very efficiently, especially Groovy scripts which compile to Java classes at runtime and are cached in their compiled form so they can be run quickly. XML Actions scripts are transformed into a Groovy script (see the* XmlActions.groovy.ftl* file for details) and then compiled and cached, so have a performance profile just like a plain Groovy script.

Any script that the Resource Facade can run can be used as a service implementation. See the Rendering Templates and Running Scripts section for details. In summary the scripts supported by default are Groovy, XML Actions, and JavaScript. Any scripting language can be supported through the javax.script or Moqui-specific interfaces. Here is an example of a service implemented with a Groovy script, defined in the org.moqui.impl.EmailServices.xml file:

In this case the location is a classpath location, but any location supported by the Resource Facade can be used. See the Resource Locations section for details on how to refer to files within components, in the local file system, or even at general URLs.

At the beginning of a script all of the input parameters passed into the service, or set through defaults in the service definition, will be in the context as fields available for use in the script. As with other artifacts in Moqui there is also an ec field with the current ExecutionContext object.

Note that the script has a context isolated from whatever called it using the ContextStack.pushContext() and popContext() methods meaning not only do fields created in the context not persist after the service is run, but the service does not have access to the context of whatever called it even though it may be running locally and within the same ExecutionContext as whatever called it.

For convenience there is a result field in the context that is of type Map<String, Object>. You can put output parameters in this Map to return them, but doing so is not necessary. After the script is run the script service runner looks for all output parameters defined on the service in the context and adds them to the results. The script can also return (evaluate to) a Map object to return results.

The service definition example near the beginning of this section shows a service with the default service type, inline. In this case the implementation is in the service.actions element, which contains a XML Actions script. It is treated just like an external script referred to by the service location but for simplicity and to reduce the number of files to work with it can be inline in the service definition.

A service implementation can also be a Java method, either a class (static) method or an object method. If the method is not static then the service runner creates a new instance of the object using the default (no arguments) constructor.

The method must take a single ExecutionContext argument and return a Map<String, Object>, so the signature of the method would be something like:

With entity-auto type services you don’t have to implement the service, the implementation is automatic based on the verb and noun attribute values. The verb can be create, update, delete, or store (which is a create if the record does not exist, update if it does). The noun is an entity name, either a full name with the package or just the simple entity name with no package.

Entity Auto services can be implicitly (automatically) defined by just calling a service named like ${verb}#${noun} with no path (package or filename). For example:

When you define a service and use the entity-auto implementation you can specify which input parameters to use (must match fields on the entity), whether they are required, default values, etc. When you use an implicitly defined entity auto service it determines the behavior based on what is passed into the service call. In the example above there is no exampleId parameter passed in, and that is the primary key field of the moqui.example.Example entity, so it automatically generates a sequenced ID for the field, and returns it as an output parameter.

For create operations in addition to automatically generating missing primary sequenced IDs it will also generate a secondary sequenced ID if the entity has a 2-part primary key and one is specified while the other is missing. There is also special behavior if there is a fromDate primary key field that is not passed in, it will use the now Timestamp to populate it.

The pattern for is update to pass in all primary key fields (this is required) and any non-PK field desired. There is special behavior for update as well. If the entity has a statusId field and a statusId parameter is passed in that is different then it automatically returns the original (DB) value in the oldStatusId output parameter. Whenever the entity has a statusId field it also returns a statusChanged boolean parameter which is true if the parameter is different from the original (DB) value, false otherwise. Entity auto services also enforce valid status transitions by checking for the existing of a matching moqui.basic.StatusFlowTransition record. If no valid transition is found it will return an error.

To add your own service runner, with its own service type, implement the org.moqui.impl.service.ServiceRunner interface and add a service-facade.service-type element in the Moqui Conf XML file.

The ServiceRunner interface has 3 methods to implement:

Here is an example of a service-facade.service-type element from the MoquiDefaultConf.xml file:

The service-type.name attribute matches against the service.type attribute, and the runner-class attribute is simply the class that implements the ServiceRunner interface.

**Examples:**

Example 1 (unknown):
```unknown
<service verb="send" noun="Email" type="script"
             location="classpath://org/moqui/impl/sendEmailTemplate.groovy" allow-remote="false">
        <implements service="org.moqui.EmailServices.send#EmailTemplate"/>
</service>
```

Example 2 (unknown):
```unknown
<service verb="send" noun="Email" type="script"
             location="classpath://org/moqui/impl/sendEmailTemplate.groovy" allow-remote="false">
        <implements service="org.moqui.EmailServices.send#EmailTemplate"/>
</service>
```

Example 3 (unknown):
```unknown
Map<String, Object> myService(ExecutionContext ec)
```

Example 4 (unknown):
```unknown
Map<String, Object> myService(ExecutionContext ec)
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/docs/framework/Data+and+Resources/Entity+Data+Import+and+Export

**Contents:**
      - Wiki Spaces
      - Page Tree
- Entity Data Import and Export
- Loading Entity XML and CSV
- Writing Entity XML
- Views and Forms for Easy View and Export

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

Entity records can be imported from XML and CSV files using the EntityDataLoader. This can be done through the Entity Facade API using the* ec.entity*.makeDataLoader() method to get an object that implements the interface and using its methods to specify which data to load and then load it (using the load() method), get an EntityList of the records (using the list() method), or validate the data against the database (using the check() method).

There are a few options for specifying which data to load. You can specify one or more locations using the location(String location) and locationList(List<String> locationList) methods. You can use text directly with the xmlText(String xmlText) and csvText(String csvText) methods. You can also load from component data directories and the entity-facade.load-data elements in the Moqui Conf XML file by specifying the types of data to load (only the files with a matching type will be loaded) using the dataTypes(Set<String> dataTypes) method.

To set the transaction timeout to something different from the default, usually larger to handle processing large files, use the transactionTimeout(int tt) method. If you expect mostly inserts you can use pass true to the useTryInsert(boolean useTryInsert) method to improve performance by doing an insert without a query to see if the record exists and then if the insert fails with an error try an update.

To help with foreign keys when records are out of order, but you know all will eventually be loaded, pass true to the dummyFks(boolean dummyFks) method and it will create empty records for foreign keys with no existing record. When the real record for the FK is loaded it will simply update the empty dummy record. To disable Entity ECA rules as the data is loaded pass true to the disableEntityEca(boolean disableEeca) method.

For CSV files you can specify which characters to use when parsing the file(s) with csvDelimiter(char delimiter) (defaults to ‘,’), csvCommentStart(char commentStart) (defaults to ‘#’), and csvQuoteChar(char quoteChar) (defaults to ‘"’).

Note that all of these methods on the EntityDataLoader return a self reference so you can chain calls, i.e. it is a DSL style API. For example:

In addition to directly using the API you can load data using the* Tool* => Entity => Import screen in the tools component that comes in the default Moqui runtime. You can also load data using the command line with the executable WAR file using the *-load *argument. Here are the command line arguments available for the data loader:

load -------- Run data loader

types=<type>[,<type>] -- Data types to load (can be anything, common are: seed, seed-initial, demo, ...)

location=<location> ---- Location of data file to load

timeout=<seconds> ------ Transaction timeout for each file, defaults to 600 seconds (10 minutes)

dummy-fks -------------- Use dummy foreign-keys to avoid referential integrity errors

use-try-insert --------- Try insert and update on error instead of checking for record first

tenantId=<tenantId> ---- ID for the Tenant to load the data into

The entity data XML file must have the entity-facade-xml root element which has a type attribute to specify the type of data in the file, which is compared with the specified types (if loading by specifying types) and only loaded if the type is in the set or if all types are loaded. Under that root element each element name is an entity or service name. For entities each attribute is a field name and for services each attribute is a input parameter.

Here is an example of a entity data XML file:

Here is an example CSV file that calls a service (the same pattern applies for loading entity data):

# first line is ${entityName or serviceName},${dataType}

org.moqui.example.ExampleServices.create#Example, demo

# second line is list of field names

exampleTypeEnumId, statusId, exampleName, exampleSize, exampleDate

# each additional line has values for those fields

EXT_MADE_UP, EXST_IN_DESIGN, Test Example Name 3, 13, 2014-03-03 15:00:00

The easiest way export entity data to an XML file is to use the EntityDataWriter, which you can get with ec.entity.makeDataWriter(). Through this interface you can specify the names of entities to export from and various other options, then it does the query and exports to a file (with the int file(String filename) method), a directory with one file per entity (with the int directory(String path) method), or to a Writer object (with the int writer(Writer writer) method). All of these methods return an int with the number of records that were written.

The methods for specifying options return a self reference to enable chaining calls. These are the methods for the query and export options:

Here is an example of an export of all OrderHeader records within a time range plus their dependents:

Another way to export entity records is to do a query and get an EntityList or EntityListIterator object and call the int writeXmlText(Writer writer, String prefix, boolean dependents) method on it. This methods writes XML to the writer, optionally adding the prefix to the beginning of each element and including dependents.

Similar to the entity data import UI you can export data using the Tool => Entity => Export screen in the tools component that comes in the default Moqui runtime.

A number of tools come together to make it very easy to view and export database data that comes from a number of different tables. We have explored the options for static (XML), dynamic, and database defined entities. In the User Interface chapter there is detail about XML Forms, and in particular list forms.

When a form-list has dynamic=true and a ${} string expansion in the auto-fields-entity.entity-name attribute then it will be expanded on the fly as the screen is rendered, meaning a single form can be used to generate tabular HTML or CSV output for any entity given an entity name as a screen parameter.

To make things more interesting results viewed can be filtered generically using a dynamic form-single with an auto-fields-entity element to generate a search form based on the entity, and an entity-find with search-form-inputs to do the query based on the entity name parameter and the search parameters from the search form.

Below is an example of these features along with a transition (DbView.csv) to export a CSV file. Don’t worry too much about all the details for screens, transitions, forms, and rendering options, they are covered in detail in the User Interface section. This screen definition is an excerpt from the ViewDbView.xml screen in the tools component that comes by default with Moqui Framework:

While this screen is designed to be used by a user it can also be rendered outside a web or other UI context to generate CSV output to send to a file or other location. If you were to just write a screen for that it would be far simpler, basically just the parameter element, the single entity-find action, and the simple form-list definition. The transitions and the search form would not be needed.

The code to do this through the screen renderer would look something like:

**Examples:**

Example 1 (unknown):
```unknown
ec.entity.makeDataLoader().dataTypes([‘seed’, ‘demo’]).load()
```

Example 2 (unknown):
```unknown
ec.entity.makeDataLoader().dataTypes([‘seed’, ‘demo’]).load()
```

Example 3 (unknown):
```unknown
$ java -jar moqui.war load types=seed,demo
```

Example 4 (unknown):
```unknown
$ java -jar moqui.war load types=seed,demo
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Logic+and+Services/Service+Definition

**Contents:**
      - Wiki Spaces
      - Page Tree
- Service Definition

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

With Moqui Framework the main unit of logic is the service. This is a service-oriented architecture with services used as internal, granular units of logic as well as external, coarse aggregations of logic. Moqui services are:

Services are defined in a services XML file using the service element. A service name is composed of a path, a verb and a noun in this structure: ${path.verb#noun}. Note that the noun is optional in a service definition, and in a service name the hash (#) between the verb and noun is also optional. Here is an example, the mantle.party.PartyServices.create#Person service (from Mantle Business Artifacts):

The only attribute that is required for a service is verb, though use of a noun is generally recommended. The type attribute is commonly used, but defaults to "inline" just like the service above which has an actions element containing the service implementation. For other types of services, i.e. other ways of implementing a service, the location and optional method attributes are used to specify what to run.

The example above has in-parameters including individual parameter elements and an auto-parameters element to pull in all non-PK fields on the mantle.party.Person entity. It also has one out-parameter, a partyId that in this case is either generated if no partyId is passed as an input parameter or the passed in value is simply passed through.

The actions element has the implementation of the service, containing a XML Actions script. In this case it calls a couple of services, and then conditionally calls a third if a roleTypeId is passed in. Note that there is no explicit setting of the partyId output parameter (in the result Map) as the Service Facade automatically picks up the context value for each declared output parameter after the service implementation is run to populate the output/results Map.

These are the attributes available on the service element:

verb: This can be any verb, and will often be one of: create, update, store, delete, or find. The full name of the service will be: "${path}.${verb}#${noun}". The verb is required and the noun is optional so if there is no noun the service name will be just the verb.

noun: For entity-auto services this should be a valid entity name. In many other cases an entity name is the best way to describe what is being acted on, but this can really be anything.

type: The service type specifies how the service is implemented. The default available options include: inline, entity-auto, script, java, interface, remote-xml-rpc, remote-json-rpc, and camel. Additional types can be added by implementing the org.moqui.impl.service.ServiceRunner interface and adding a service-facade.service-type element in the Moqui Conf XML file. The default value is inline meaning the service implementation is under the service.actions element.

location: The location of the service. For scripts this is the Resource Facade location of the file. For Java class methods this is the full class name. For remote services this is the URL of the remote service. Instead of an actual location can also refer to a pre-defined location from the service-facade.service-location element in the Moqui Conf XML file. This is especially useful for remote service URLs.

method: The method within the location, if applicable to the service type.

authenticate: If not set to false (is true by default) a user much be logged in to run this service. If the service is running in an ExecutionContext with a user logged in that will qualify. If not then either a "authUserAccount" parameter or the "authUsername" and "authPassword" parameters must be specified and must contain valid values for a user of the system. An "authTenantId" parameter may also be specified to authenticate the user in a specific tenant instance. If specified will be used to run the service with that as the context tenant. Can also be set to anonymous-all or anonymous-view and not only will authentication not be required, but this service will run as if authorized (using the NA UserAccount) for all actions or for view-only.

allow-remote: Defaults to false meaning this service cannot be called through remote interfaces such as JSON-RPC and XML-RPC. If set to true it can be. Before settings to true make sure the service is adequately secured (for authentication and authorization).

validate: Defaults to true. Set to false to not validate input parameters, and not automatically remove unspecified parameters.

transaction-timeout: The timeout for the transaction, in seconds. This value is only used if this service begins a transaction (force-new, force-cache, or use-or-begin or cache and there is no other transaction already in place).

semaphore: Intended for use in long-running services (usually scheduled). This uses a record in the database to lock the service so that only one instance of it can run against a given database at any given time. Options include none (default), fail, and wait.

semaphore-timeout: When waiting how long before timing out, in seconds. Defaults to 120s.

semaphore-sleep: When waiting how long to sleep between checking the semaphore, in seconds. Defaults to 5s.

semaphore-ignore: Ignore existing semaphores after this time, in seconds. Defaults to 3600s (1 hour).

The input and output of a service are each a Map with name/value entries. Input parameters are specified with the in-parameters element, and output parameters with the out-parameters element. Under these elements use the parameter element to define a single parameter, and the auto-parameters element to automatically define parameters based on primary key (pk), non-primary key (nonpk) or all fields of an entity.

An individual parameter element has attributes to define it including:

For parameter object types that contain other objects (such as List, Map, and Node) the parameter element can be nested to specify what to expect (and if applicable, validate) within the parameter object.

In addition to the required attribute, validations can be specified for each parameter with these sub-elements:

Validation elements can be combined using the val-or and val-and elements, or negated using the val-not element.

When a XML Form field is based on a service parameter with validations certain validations are automatically validated in the browser with JavaScript, including required, matches, number-integer, number-decimal, text-email, text-url, and text-digits.

Now that your service is defined, essentially configuring the behavior of the Service Facade when the service is called, it is time to implement it.

**Examples:**

Example 1 (unknown):
```unknown
mantle.party.PartyServices.create#Person
```

Example 2 (unknown):
```unknown
<service verb="create" noun="Person">
        <in-parameters>
            <auto-parameters entity-name="mantle.party.Party"/>
            <auto-parameters entity-name="mantle.party.Person" include="nonpk"/>
            <parameter name="firstName" required="true"/>
            <parameter name="lastName" required="true"/>
            <parameter name="roleTypeId"/>
        </in-parameters>
        <out-parameters><parameter name="partyId"/></out-parameters>
        <actions>
            <service-call name="create#mantle.party.Party" in-map="context + [partyTypeEnumId:'PtyPerson']" out-map="context"/>
            <service-call name="create#mantle.party.Person" in-map="context"/>
            <if condition="roleTypeId"><service-call name="create#mantle.party.PartyRole" in-map="[partyId:partyId, roleTypeId:roleTypeId]"/></if>
        </actions>
</service>
```

Example 3 (unknown):
```unknown
<service verb="create" noun="Person">
        <in-parameters>
            <auto-parameters entity-name="mantle.party.Party"/>
            <auto-parameters entity-name="mantle.party.Person" include="nonpk"/>
            <parameter name="firstName" required="true"/>
            <parameter name="lastName" required="true"/>
            <parameter name="roleTypeId"/>
        </in-parameters>
        <out-parameters><parameter name="partyId"/></out-parameters>
        <actions>
            <service-call name="create#mantle.party.Party" in-map="context + [partyTypeEnumId:'PtyPerson']" out-map="context"/>
            <service-call name="create#mantle.party.Person" in-map="context"/>
            <if condition="roleTypeId"><service-call name="create#mantle.party.PartyRole" in-map="[partyId:partyId, roleTypeId:roleTypeId]"/></if>
        </actions>
</service>
```

Example 4 (unknown):
```unknown
mantle.party.Person
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/User+Interface/XML+Screen

**Contents:**
      - Wiki Spaces
      - Page Tree
- XML Screen
- Subscreens
- Standalone Screen
- Screen Transition
- Parameters and Web Settings
- Screen Actions, Pre-Actions, and Always Actions
- XML Screen Widgets
- Section, Condition and Fail-Widgets

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

Screens in Moqui are organized in two ways:

The hierarchy model is used to reference the screen, and in a URL specify which screen to render by its path in the hierarchy. Screens also contain links to other screens (literally a hyperlink or a form submission) that is more like the structure of going from one node to another in a graph through a transition.

The subscreen hierarchy is primarily used to dynamically include another screen, a subscreen or child screen. The subscreens of a screen can also be used to populate a menu.

When a screen is rendered it is done with a root screen and a list of screen names.

The root screen is configured per webapp in the Moqui Conf XML file with the moqui-conf.webapp-list.webapp.root-screen element. Multiple root screens can be configured per webapp based on a hostname pattern, providing a convenient means of virtual hosting within a single webapp.

You should have at least one catchall root-screen element meaning that the host is set to the regular expression ".*". The MoquiDefaultConf.xml file uses the default webroot component and its root screen which you can override in a runtime or component Moqui Conf XML file.

If the list of subscreen names does not reach a leaf screen (with no subscreens) then the default subscreen, specified with the screen.subscreens.default-item attribute will be used. Because of this any screen that has subscreens should have a default subscreen.

There are four ways to add subscreens to a screen:

For #1 (Directory Structure) a directory structure would look something like this (from the Example application):

The pattern to notice is that if there is are subscreens there should be a directory with the same name as the XML Screen file, just without the .xml extension. The Feature.xml file is an example of a screen with subscreens, whereas the FindExampleFeature.xml has no subscreens (it is a leaf in the hierarchy of screens).

For approach #2 (Screen XML File) the subscreens-item element would look something like this element from the apps.xml file used to mount the Example app’s root screen:

For #3 (Database Record) the record in the database in the SubscreensItem entity would look something like this (an adaptation of the XML element above):

For #4 (Moqui Conf XML File) you can put these elements in any of the Moqui Conf XML files that get merged into that runtime configuration. The main way to do this is in a MoquiConf.xml file in your component directory so the configuration is in the same component as the screens and you don't have to modify and maintain files elsewhere. See more details about the Moqui Conf XML options in the Run and Deploy instructions. Here is an example from the MoquiConf.xml file in the moqui/example component:

Within the widgets (visual elements) part your screen you specify where to render the active subscreen using the subscreens-active element. You can also specify where the menu for all subscreens should be rendered using the* subscreens-men*u element. For a single element to do both with a default layout use the subscreens-panel element.

While the full path to a screen will always be explicit, when following the default subscreen item under each screen there can be multiple defaults where all but one have a condition. In the webroot.xml screen there is an example of defaulting to an alternate subscreen for the iPad:

With this in place an explicit screen path will go to either the "apps" subscreen or the "ipad" subscreen, but if neither is explicit it will default to the ipad.xml subscreen if the User-Agent matches, otherwise it will default to the normal apps.xml subscreen. Both of these have the example and tools screen hierarchies under them but have slightly different HTML and CSS to accommodate different platforms.

Once a screen such as the FindExample screen is rendered through one of these two its links will retain that base screen path in URLs generated from relative screen paths so the user will stay in the path the original default pointed to.

Normally screens will be rendered following the render path, starting with the root screen. Each screen along the way may add to the output. A screen further down the path that is rendered without any previous screens in the path adding to the output is a "standalone" screen.

This is useful when you want a screen to control all of its output and not use headers, menus, footers, etc from the screen it is under in the subscreens hierarchy.

There are two ways to make a screen standalone:

The first option is most useful for screens that are the root of an application separate from the rest and that need different decoration and such. The second option is most useful for screens that are sometimes used in the context of an application, and other times used to produce undecorated output like a CSV file or for loading dynamically in a dialog window or screen section.

A transition is defined as a part of a screen and is how you get from one screen to another, processing input if applicable along the way. A transition can of course come right back to the same screen and when processing input often does.

The logic in transitions (transition actions) should be used only for processing input, and not for preparing data for display. That is the job of screen actions which, conversely, should not be used to process input (more on that below).

When a XML Screen is running in a web application the transition comes after the screen in the URL. In any context the transition is the last entry in the list of subscreen path elements. For example the first path goes to the EditExample screen, and the second to the updateExample transition within that screen:

/apps/example/Example/EditExample

/apps/example/Example/EditExample/updateExample

When a transition is the target of a HTTP request any actions associated with the transition will be run, and then a redirect will be sent to ask the HTTP client (usually a web browser) to go to the URL of the screen the transition points to. If the transition has no logic and points right to another screen or external URL when a link is generated to that transition it will automatically go to that other screen or external URL and skip calling the transition altogether. Note that these points only apply to a XML Screen running in a web-based application.

A simple transition that goes from one screen to another, in this case from FindExample to EditExample, looks like this:

The path in the url attribute is based on the location of the two screens as siblings under the same parent screen. In this attribute a simple dot (".") refers to the current screen and two dots ("..") refers to the parent screen, following the same pattern as Unix file paths.

For screens that have input processing the best pattern to use is to have the transition call a single service. With this approach the service is defined to agree with the form that is submitted to the corresponding transition. This makes the designs of both more clear and offers other benefits such as some of the validations on the service definition are used to generate matching client-side validations. When a service-call element is directly under a transition element it is treated a bit differently than if it were in an actions block and it automatically gets in parameters from the context (equivalent to in-map="context") and puts out parameters in the context (equivalent to out-map="context").

This sort of transition would look like this (the updateExample transition on the EditExample screen):

In this case the default-response.url attribute is simple a dot which refers to the current screen and means that after this transition is processed it will go to the current screen.

A screen transition can also have actions instead of a single service call by using the actions element. If a transition has both service-call and actions elements the service-call will be run first and then the actions will be run. Just as with all actions elements in all XML files in Moqui, the subelements are standard Moqui XML Actions that are transformed into a Groovy script. This is what a screen transition with actions might look like (simplified example, also from the FindExample screen):

This example also shows how you would do a simple entity find operation and return the results to the HTTP client as a JSON response. Note the call to the ec.web.sendJsonResponse() method and the none value for the default-response.type attribute telling it to not process any additional response.

As implied by the element default-response you can also conditionally choose a response using the conditional-response element. This element is optional and you can specify any number of them, though you should always have at least one default-response element to be used when none the conditions are met. There is also an optional error-response which you may use to specify the response in the case of an error in the transition actions.

A transition with a conditional-response would look something like this simplified example from the DataExport screen:

This is allowing the script to specify that no response should be sent (when it sends back the data export), otherwise it transitions back to the current screen. Note that the text under the condition.expression element is simply a Groovy expression that will be evaluated as a boolean.

All *-response elements can have parameter subelements that will be used when redirecting to the url or other activating of the target screen. Each screen has a list of expected parameters so this is only necessary when you need to override where the parameter value comes from (default defined in the parameter tag under the screen) or to pass additional parameters.

Here are the shared attributes of the default-response, conditional-response, and error-response elements:

One of the first things in a screen definition is the parameters that are passed to the screen. This is used when building a URL to link to the screen or preparing a context for the screen rendering. You do this using the parameter element, which generally looks something like this:

The name attribute is the only required one, and there are others if you want a default static value (with the value attribute) or to get the value by default from a field in the context other than one matching the parameter name (with the from attribute).

While parameters apply to all render modes there are certain settings that apply only when the screen is rendered in a web-based application. These options are on the screen.web-settings element, including:

Before rendering the visual elements (widgets) of a screen data preparation is done using XML Actions under the screen.actions element. These are the same XML Actions used for services and other tools and are described in the Logic and Services chapter. There are elements for running services and scripts (inline Groovy or any type of script supported through the Resource Facade), doing basic entity and data moving operations, and so on.

Screen actions should be used only for preparing data for output. Use transition actions to process input.

When screens are rendered it is done in the order they are found in the screen path and the actions for each screen are run as each screen in the list is rendered. To run actions before the first screen in the path is rendered use the pre-actions element. This is used mainly for preparing data needed by screens that will include the current screen (i.e., before the current screen in the screen path). When using this keep in mind that a screen can be included by different screens in different circumstances.

If you want actions to run before the screen renders and before any transition is run, then use the always-actions element. The main difference between always-actions and pre-actions is that the pre-actions only run before a screen or subscreen is rendered, while always-actions will run before any transition in the current screen and any transition in any subscreen. The always-actions also run whether the screen will be rendered, while the pre-actions only run if the screen will be rendered (i.e., is below a standalone screen in the path).

The elements under the screen.widgets element are the visual elements that are rendered, or when producing text that actually produce the output text. The most common widgets are XML Forms (using the form-single and form-list elements) and included templates. See the section below for details about XML Forms.

While XML Forms are not specific to any render mode templates by their nature are particular to a specific render mode. This means that to support multiple types of output you’ll need multiple templates. The webroot.xml screen (the default root screen) has an example of including multiple templates for different render modes:

The same screen also has an example of supporting multiple render modes with inline text:

These are the widget elements for displaying basic things:

To structure screens use these widget elements:

A section is a special widget that contains other widgets. It can be used anywhere other screen widget elements are used. A section has widgets, condition, and fail-widgets subelements. The screen element also supports these subelements, making it a sort of top-level section of a screen.

The condition element is used to specify a condition. If it evaluates to true the widgets under the widgets element will be rendered, and if false the widgets under the fail-widgets element will be.

Moqui XML Screen and XML Form files are transformed to the desired output using a set of macros in a Freemarker (FTL) template file. There is one macro for each XML element to produce its output when the screen is rendered.

There are two ways to specify the macro template used to render a screen:

The location of the macro template can be any location supported by the Resource Facade. The most common types of locations you’ll use for this include component, content, and runtime directory locations.

The default macro templates included with Moqui are specified in the MoquiDefaultConf.xml file along with all other default settings. You can override them with your own in the Moqui Conf XML file specified at runtime.

When you use a custom macro template file you don’t need to include a macro for every element you want to render differently. You can start the file with an include of a default macro file or any other macro file you want to use, and then just override the macros for desired elements. An include of another macro file within your file will look something like:

The location here can also be any location supported by the Resource Facade.

You can use this approach to add your own custom elements. In other words, the macros in your custom macro template file don’t have to be an override of one of the stock elements in Moqui, they can be anything you want.

Use this approach to add your own widget elements and form field types that you want to be consistent across screens in your applications. For example you can add macros for special containers with dynamic HTML like the dialogs in the default macros, or a special form field like a slider or a custom form field widget you create with JavaScript.

When you add a macro for a custom element you can just start using it in your XML Screen files even though they are not validated by the XSD file. If you want them to be validated:

Because a single XML Screen file can support output in multiple render modes the render mode to use is selected using a parameter to the screen: the renderMode parameter. For web-based applications this can be a URL parameter. For any application this can be set in a screen action, usually a pre-action (i.e., under the screen.pre-actions element).

The value of this parameter can be any string matching a screen-text-output.type attribute in the Moqui Conf XML file. This includes the OOTB types as well as any you add in your runtime conf file.

All screens in the render path are rendered regardless of the render mode, so for output types where you only want the content of the last screen in the path to be included (like CSV), use the lastStandalone=true parameter along with the renderMode parameter.

**Examples:**

Example 1 (unknown):
```unknown
MoquiDefaultConf.xml
```

Example 2 (unknown):
```unknown
MoquiConf.xml
```

Example 3 (unknown):
```unknown
Feature.xml
```

Example 4 (unknown):
```unknown
FindExampleFeature.xml
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Data+and+Resources/Data+Feed

**Contents:**
      - Wiki Spaces
      - Page Tree
- Data Feed

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

A Data Feed is a configurable way to push Data Documents to a service or group multiple documents for retrieval through an API call. There service to call is specified in the feedReceiveServiceName field and should implement the org.moqui.EntityServices.receive#DataFeed service interface. The main input parameter is the documentList which will have a List of Maps representing each DataDocument instance to process when received. See the service interface definition for more details:

framework/service/org/moqui/EntityServices.xml

The example below is a push feed (dataFeedTypeEnumId="DTFDTP_RT_PUSH") to send documents to the HiveMind.SearchServices.indexAndNotify#HiveMindDocuments service when any data in any of the documents is changed in the database through the Moqui Entity Facade. The framework automatically keeps track of push Data Feeds and the entities that are part of the Data Documents associated with them to look for changes as create, update, and delete operations are done. This is an efficient way to get updated Data Documents in real time.

Here is an example of entity-facade-xml for the records to configure a push Data Feed:

Each DataFeedDocument record associates a DataDocument record to the DataFeed record to be included in the feed.

On a side note, when you have data you want to index that is loaded through a XML data file as part of the load process and it may be loaded before the Data Feed is loaded an activated, you can include an element for a ServiceTrigger record and the Service Facade will call the service during the load process to index for the feed. Here is an example of that:

The DataFeed example above is for a push Data Feed. To setup a feed for manual pull just set dataFeedTypeEnumId="DTFDTP_MAN_PULL" on the DataFeed record. Any type of Data Feed can be retrieved manually, but with this type the feed will not be automatically run. To get the documents for any feed through the API use a statement like this:

**Examples:**

Example 1 (unknown):
```unknown
org.moqui.EntityServices.receive#DataFeed
```

Example 2 (unknown):
```unknown
HiveMind.SearchServices.indexAndNotify#HiveMindDocuments
```

Example 3 (unknown):
```unknown
<moqui.entity.feed.DataFeed dataFeedId="HiveMindSearch" dataFeedTypeEnumId="DTFDTP_RT_PUSH" feedName="HiveMind Search" feedReceiveServiceName="HiveMind.SearchServices.indexAndNotify#HiveMindDocuments"/> 

<moqui.entity.feed.DataFeedDocument dataFeedId="HiveMindSearch" dataDocumentId="HmProject"/>

<moqui.entity.feed.DataFeedDocument dataFeedId="HiveMindSearch" dataDocumentId="HmTask"/>
```

Example 4 (unknown):
```unknown
<moqui.entity.feed.DataFeed dataFeedId="HiveMindSearch" dataFeedTypeEnumId="DTFDTP_RT_PUSH" feedName="HiveMind Search" feedReceiveServiceName="HiveMind.SearchServices.indexAndNotify#HiveMindDocuments"/> 

<moqui.entity.feed.DataFeedDocument dataFeedId="HiveMindSearch" dataDocumentId="HmProject"/>

<moqui.entity.feed.DataFeedDocument dataFeedId="HiveMindSearch" dataDocumentId="HmTask"/>
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Data+and+Resources/Resources+and+Content

**Contents:**
      - Wiki Spaces
      - Page Tree
- Resources: Content, Templates, and Scripts
- Resource Locations
- Using Resources
- Rendering Templates and Running Scripts

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

A Resource Facade location string is structured like a URL with a protocol, host, optional port, and filename. It supports the standard Java URL protocols (http, https, ftp, jar, and file). It also supports some additional useful protocols:

Additional protocols can be added by implementing the org.moqui.context.ResourceReference interface and adding a resource-facade.resource-reference element to the Moqui Conf XML file. The supported protocols listed above are configured this way in the MoquiDefaultConf.xml file.

The simplest way to use a resource, and supported by all location protocols, is to read the text or binary content. To get the text from a resource location use the ec.resource.getLocationText(String location, boolean cache) method. To get an InputStream for binary or large text resources use the ec.resource.getLocationStream(String location) method.

For a wider variety of operations beyond just reading resource data use the ec.resource.getLocationReference(String location) method to get an instance of the org.moqui.context.ResourceReference interface. This interface has methods to get text or binary stream data from the resource like the Resource Facade methods. It also has methods for directory resources to get child resources, find child files and/or directories recursively by name, write text or binary stream data, and move the resource to another location.

There is a single method for rendering a template in a resource at a location: ec.resource.renderTemplateInCurrentContext(String location, Writer writer). This method returns nothing and simply writes the template output to the writer. By default FTL (Freemarker Template Language) and GString (Groovy String) are supported.

Additional template renderers can be supported by implementing the org.moqui.context.TemplateRenderer interface and adding a resource-facade.template-renderer element to the Moqui Conf XML file.

To run a script through the Resource Facade use the Object ec.resource.runScriptInCurrentContext(String location, String method) method. Specify the location and optionally the method within the script at the location and this method will run the script and return the Object that the script returns or evaluates to. There is a variation on this method in the Resource Facade that also accepts a Map additionalContext parameter for convenience (it just pushes the Map onto the context stack, runs the script, then pops from the context stack). By default Moqui supports Groovy, XML Actions, JavaScript, and any scripting engine available through the javax.script.ScriptEngineManager.

To add a script runner you have two options. You can use the javax.script approach for any scripting language that implements the javax.script.ScriptEngine interface and is discoverable through the javax.script.ScriptEngineManager. Moqui uses this to discover the script engine using the extension on the script’s filename and execute the script. If the script engine implements the javax.script.Compilable interface then Moqui will compile the script and cache it in compiled form for the faster repeat execution of a script at a given location.

The other option is to implement the org.moqui.context.ScriptRunner interface and add a resource-facade.script-runner element to the Moqui Conf XML file. Moqui uses Groovy the XML Actions through this interface as it provides additional flexibility not available through the javax.script interfaces.

Because Groovy is the default expression language in Moqui there are a few Resource Facade methods to easily evaluate expressions for different purposes:

These methods accept a debugLocation parameter that is used in error messages. For faster evaluation these expressions are all cached, using the expression itself as the key for maximal reuse.

**Examples:**

Example 1 (unknown):
```unknown
org.moqui.context.ResourceReference
```

Example 2 (unknown):
```unknown
resource-facade.resource-reference
```

Example 3 (unknown):
```unknown
org.moqui.context.ResourceReference
```

Example 4 (unknown):
```unknown
org.moqui.context.TemplateRenderer
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/docs/framework/Framework+Features

**Contents:**
      - Wiki Spaces
      - Page Tree
- Moqui Framework Features (through 2.0.0)
- Big Ideas
- Flexible deployment
- Clustering Support
- Default Runtime
- Technical Features
- Developer Friendly API
- Security

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

Moqui Framework gives you flexible tools to quickly create functional and secure applications.

Moqui Framework helps you build applications quickly and scale complex applications to hundreds of thousands of lines of efficient, well organized code instead of millions of lines of mess. Along the way you work on only what you care about, and let the framework take care of the rest.

Comprehensive: Moqui Framework is designed to provide comprehensive infrastructure for enterprise applications and handle common things so you can focus your efforts on the business requirements, whether it be for a multi-organizational ERP system, an interactive community web site, or even a bit of simple content with a few forms thrown into the mix.

Automatic Functionality: By using the tools and practices recommended for the framework you can easily build complex applications with most security and performance concerns taken care of for you.

No Code Generation: Moqui relies on dynamic runtime functionality to avoid the need for code generation. This keeps your development artifacts small and easy to maintain, not just easy to create.

True 3-Tier Architecture: Many modern frameworks have tools for database interaction and user interaction but you have to roll your own logic layer. Moqui has a strongly defined and feature rich logic layer built around service-oriented principles. This makes it easy to build a service library for internal application use, and automatically expose services externally as needed.

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/User+Interface/Sending+and+Receiving+Email

**Contents:**
      - Wiki Spaces
      - Page Tree
- Sending and Receiving Email

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

The first step to sending and receiving email is to setup an EmailServer with something like this record loaded:

Note that these are all example values and should be changed to real values, especially for the smtpHost, storeHost, mailUsername and mailPassword fields. The store* fields are for the remote mail store for incoming email. Here are some other common values for the port fields:

If you need to work with multiple email servers, just add EmailServer records with the settings for each. When sending an email using an email template the EmailServer to use is specified on the EmailTemplate record with the emailServerId field.

Speaking of EmailTemplate, the next step for sending an email is to create one. Here is an example from HiveMind PM for sending a task update notification email:

The general idea is to define a screen that will be rendered for the body when the email is sent (bodyScreenLocation). The email body screen is a little bit different from normal UI screens because there is no Web Facade available when it is rendered as it is not part of a web request. The URL prefixes (domain name, port, etc) are generated based on webapp settings in the Moqui Conf XML file, which is why it is necessary to specify a webappName which is matched against the moqui-conf.webapp-list.webapp.name attribute.

The subject is also a simple template of sorts, it is a Groovy String that is expanded when the email is sent using the same context as rendering the body. The fromAddress field is required, and you can optionally specify ccAddresses and bccAddresses.

Attachments to an EmailTemplate can be added with the EmailTemplateAttachment entity. The filename to use on the email must be specified using the fileName field. The attachment itself comes from rendering a screen specified with the attachmentLocation field. The screenRenderMode field is passed to the ScreenRender to specify the type of output to get from the screen. It is also used to determine the MIME/content type. If empty the content at attachmentLocation will be sent over without screen rendering and its MIME type will be based on its extension. This can be used to generate XSL:FO that is transformed to a PDF and attached to the email with by setting screenRenderMode to xsl-fo.

Once the EmailServer and EmailTemplate are defined you can send email using the org.moqui.impl.EmailServices.send#EmailTemplate service. When calling this service pass in the emailTemplateId parameter to identify the EmailTemplate. As mentioned above the EmailServer will be determined based on the EmailTemplate.emailServerId field.

The email addresses to send the message to are passed in the toAddresses parameter which is a plain String and can have multiple comma-separated addresses. The parameters used to render the email screen are separate from the context of the service and are passed to it in the bodyParameters input parameter. By default the send#EmailTemplate service saves details about the outgoing message in a record of the EmailMessage entity. To disable this pass in false in the createEmailMessage parameter. The output parameters are messageId which is the value put in the Message-ID email header field, and emailMessageId if a EmailMessage record is created.

The EmailMessage entity is used for both outgoing and incoming email messages. For outgoing messages sent using the send#EmailTemplate service the status (statusId) starts out as Sent (actually sets it to Ready, sends the email, then sets it to Sent) and may be changed to Viewed if there is open message tracking based on an image request (usually with the emailMessageId as a parameter or path element). If the message is returned undeliverable the status may be changed to Bounced.

An EmailMessage may also be sent manually instead of from a template and in that case the status would start out as Draft. Once the user is done with the message they would change the status to Ready, and then when it is actually sent the status would change to Sent. Incoming messages start in the Received status and can be changed to the Viewed status after they are initially opened.

For email threads the EmailMessage entity has rootEmailMessageId for the original messages that all messages in the thread are grouped under, and parentEmailMessageId for the message the current message was an immediate reply to.

Receiving email follows a very different path. The org.moqui.impl.EmailServices.poll#EmailServer service polls a IMAP or POP3 mailbox based on the settings on the EmailServer entity. It takes a single input parameter, the emailServerId. Generally this will be run as a scheduled service.

For each message found in the mailbox and not yet marked as seen this service calls the Email ECA (EMECA) rules for it. These are similar to the Entity and Service ECA rules but there is no special trigger, just the receiving of an email. The conditions can be used to only run the actions for a particular to address or tag in the subject like or any other criteria desired.

The context for the condition and actions will include a headers Map with all of the email headers in it (either String, or List of String if there are more than one of the header), and a fields Map with the following: toList, ccList, bccList, from, subject, sentDate, receivedDate, bodyPartList. The *List fields are List of String, and the *Date fields are java.util.Date objects. For a service that is called directly with this context setup you can implement the org.moqui.EmailServices.process#EmailEca interface.

The actions and services they call can do anything with the incoming email. To save the incoming message you can use the org.moqui.impl.EmailServices.save#EcaEmailMessage service.

**Examples:**

Example 1 (unknown):
```unknown
<moqui.basic.email.EmailServer emailServerId="SYSTEM"
   smtpHost="mail.test.com" smtpPort="25" smtpStartTls="N" smtpSsl="N"
   storeHost="mail.test.com" storePort="143" storeProtocol="imap"
   storeDelete="N" mailUsername="TestUser" mailPassword="TestPassword"/>
```

Example 2 (unknown):
```unknown
<moqui.basic.email.EmailServer emailServerId="SYSTEM"
   smtpHost="mail.test.com" smtpPort="25" smtpStartTls="N" smtpSsl="N"
   storeHost="mail.test.com" storePort="143" storeProtocol="imap"
   storeDelete="N" mailUsername="TestUser" mailPassword="TestPassword"/>
```

Example 3 (unknown):
```unknown
<moqui.basic.email.EmailTemplate emailTemplateId="HM_TASK_UPDATE"
   description="HiveMind Task Update Notification"
   emailServerId="SYSTEM" webappName="webroot"
   bodyScreenLocation="component://HiveMind/screen/TaskUpdateNotification.xml"
   fromAddress="[email protected]" ccAddresses="" bccAddresses=""
   subject="Task Updated: ${document._id} - ${document.WorkEffort.name}"/>
```

Example 4 (unknown):
```unknown
<moqui.basic.email.EmailTemplate emailTemplateId="HM_TASK_UPDATE"
   description="HiveMind Task Update Notification"
   emailServerId="SYSTEM" webappName="webroot"
   bodyScreenLocation="component://HiveMind/screen/TaskUpdateNotification.xml"
   fromAddress="[email protected]" ccAddresses="" bccAddresses=""
   subject="Task Updated: ${document._id} - ${document.WorkEffort.name}"/>
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/docs/framework/Run+and+Deploy

**Contents:**
      - Wiki Spaces
      - Page Tree
- Running and Deployment Instructions
- 1. Quick Start
  - Required Software: Java JDK 11 and ElasticSearch
  - Moqui Binary Release Quick Start
  - From Source Quick Start with ElasticSearch
  - From Source Quick Start with Docker Compose
  - Really Quick Start
- 2. Runtime Directory and Moqui Configuration XML File

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

This document explains how to run Moqui through the executable war file, or by deploying a war file in an application server.

The only required software for the default configuration of Moqui Framework is the Java SE JDK version 11 or later. ElasticSearch or OpenSearch are also required for certain functionality in the service library (mantle-usl) and applications including POPC ERP, HiveMind, and Marble ERP.

On Linux OpenJDK is generally the best option. For Debian based distributions the apt package is openjdk-11-jdk. For Fedora/CentOS/Redhat distributions the yum package is java-11-openjdk-devel.

On macOS and Windows there are OpenJDK distributions available for download from Azul Systems, including a distribution for the Apple ARM architecture:

https://www.azul.com/downloads/?package=jdk#download-openjdk

The Oracle Java SE downloads are another good option:

http://www.oracle.com/technetwork/java/javase/downloads

Moqui Framework also includes an ElasticSearch client for ElasticSearch 7.0 or later. The recommended version to use is the OSS (Apache 2.0 licensed) build with no JDK included. If this is available on localhost port 9200 the default configuration in Moqui will find it, otherwise see configuration environment variables and such below for more options.

https://www.elastic.co/downloads/elasticsearch-oss-no-jdk

NOTE: Before the java11 branch in the moqui-framework repository was merged on 25 April 2022 Moqui required Java 8 or later. For more information see pull request 527.

Use the following steps to do a local install from source and run with the default embedded database (H2) and ElasticSearch installed in the runtime/elasticsearch directory.

Use the following steps to do a local install from source and run with a database and ElasticSearch in Docker containers separate from Moqui. This works best on Linux but can be used with some variations on MacOS and Windows.

Moqui Framework has two main parts to deploy:

However you use the executable WAR file, you must have a runtime directory and you may override default settings with a XML configuration file.

All configuration for Moqui Framework lives in the Moqui Conf XML file. The actual configuration XML file used at runtime is built by merging various XML files in this order:

The runtime directory is the main place to put components you want to load, the root files (root screen, etc) for the web application, and configuration files. It is also where the framework will put log files, H2 database files (if you are using H2), JCR repo files, etc. You may eventually want to create your own runtime directory and keep it in your own source repository (fork the moqui-runtime repository) but you can use the default one to get started and for most deployments with add-on applications everything in moqui-runtime you will commonly want to override or extend can be done within your add-on components.

Specify these two properties:

There are two ways to specify these two properties:

See below for examples.

Yep, that's right: an executable WAR file.

If the first argument is load it will load data. If the first argument is help it will show the help text. If there are no arguments or the first argument is anything else it will run the embedded web server (the Jetty Servlet Container). The MoquiStart class can also be run directly if the WAR file has been unzipped into a directory.

If no types or location argument is used all found data files of all types will be loaded.

The easiest way to run is to have a moqui directory with the moqui.war file and the runtime directory in it. With the binary distribution of Moqui when you unzip the archive this is what you'll have.

To use the default settings:

The best way to manage source repositories for components is to have one repository (on GitHub or elsewhere) per component that contains only the component directory.

Following this pattern the Gradle build scripts in Moqui have tasks to download components and their dependencies from a git repository, or from current or release archives.

Known open source components are already configured in the addons.xml file. To add private and other components or override settings for components in the addons.xml file, create a file called myaddons.xml and put it in the moqui directory.

Here is a summary of the Gradle tasks for component management (using the HiveMind component for example). All of the get tasks get the specified component plus all components it depends on (as specified in its component.xml file).

There are also Gradle tasks to help you manage your components from git. Each of these commands does git operations if a .git directory exists for the moqui (root) repository, the runtime repository, and all components.

Moqui Framework uses Gradle for building from source. There are various custom tasks to automate frequent things, but most work is done with the built-in tasks from Gradle. There is also an Ant build file for a few common tasks, but not for building from source.

The examples above use the Gradle Wrapper (gradlew) included with Moqui. You can also install Gradle (2.0 or later) The load and run tasks depend on the build task, so the easiest to get a new development system running with a populated database is:

This will build the war file, run the data loader, then run the server. To stop it just press <ctrl-c> (or your preferred alternative).

In production it is more common to have an external ElasticSearch cluster running separate from the Moqui server or cluster. This can also be used for local development where you start, stop, clear data, etc separate from Moqui or the Moqui Gradle tasks. This will work with any variation of ElasticSearch version 7.0.0 or later (OSS or not, with or without JDK, hosted by Elastic or AWS, etc). If you are installing ElasticSearch the recommended variation is the OSS with no JDK:

https://www.elastic.co/downloads/elasticsearch-oss-no-jdk

The configuration for ElasticSearch clusters is in the Moqui Conf XML file with a 'default' cluster in the MoquiDefaultConf.xml file that uses environment variables (or Java system properties) for easier configuration. See the section below for ElasticSearch and other environment variables available. Unless you are using an ElasticSearch install that requires HTTP Basic Authentication the only env var (property) you need to configure is elasticsearch_url which defaults to http://localhost:9200.

ElasticSearch may be installed in the runtime/elasticsearch directory and run by Moqui when it starts (through MoquiStart only) as well as started, stopped, and data cleaned through various Gradle tasks. In local development environments it is more common to run a local instance of ElasticSearch and clear the data in it along with the H2 database data. This can also be used for production environments where you do not need or want a separate ElasticSearch cluster.

Note that the current support for ElasticSearch installed in runtime/elasticsearch in MoquiStart and Gradle tasks is limited to Unix variants only (ie Linux, MacOS) and uses the OSS no-JDK build for Linux (with no JDK it also works on MacOS). This will not currently work on Windows machines, so if you're doing development on Windows you get to install and manage ElasticSearch separately, just make sure it's available at http://localhost:9200 (or configure elasticsearch_url to point elsewhere).

Make sure that the JAVA_HOME environment variable is set so ElasticSearch knows where to find the Java JDK.

To install ElasticSearch in runtime/elasticsearch the easiest way is to use the Gradle task. This will download the OSS no-JDK Linux, Mac, or Windows build of ElasticSearch and expand the archive in runtime/elasticsearch.

$ ./gradlew downloadElasticSearch

In Gradle there are also startElasticSearch and stopElasticSearch tasks. Note that Gradle supports partial task names as long as they match a single task so you can use shorter task names like downloadel, startel, and stopel.

$ ./gradlew startel$ ./gradlew stopel

These report a message when trying to start or stop, and do nothing if they don't find an ElasticSearch install (if the runtime/elasticsearch/bin directory does not exist) or they find that ES is already running or not running (is running if the runtime/elasticsearch/pid file exists). Because of this if you aren't sure of ElasticSearch is running or not you can run startel to make sure it's running or stopel to make sure it's not running.

The cleanDb, load, loadSave, reloadSave, and test tasks all respect the runtime/elasticsearch install. If ES is running (pid file exists) cleanDb will stop ES, delete the data directory, then start ES. Note that the test task automatically starts ES if the bin directory exists (detect ES install) and the pid file does not, but it does not currently stop ES after running all tests.

The MoquiStart class will try to start ElasticSearch installed in runtime/elasticsearch if it finds a 'bin' directory there. To disable this behavior use the no-run-es argument. To use this just run Moqui with:

$ java -jar moqui.war

This also works with along with the load argument, ie:

$ java -jar moqui.war load

This will start and stop ElasticSearch along with Moqui, running it in a forked process using Runtime.exec(). Note that the MoquiStart class is used when running the executable WAR with java -jar as in the examples above, and when running from the root directory of the expanded WAR file as the Procfile does, like:

java -cp . MoquiStart port=5000 conf=conf/MoquiProductionConf.xml

The MoquiStart class is NOT used when you drop the embedded WAR file in an external Servlet Container like Tomcat or Jetty. If you deploy Moqui that way you must use an external ElasticSearch server or cluster.

For a local development instance of Moqui a common development cycle is to clean then load data, run tests, reload data from saved archives and run tests, etc. To do a full test run make sure ElasticSearch is installed in runtime/elasticsearch and preferably is not already running, then do:

$ ./gradlew loadsave test stopel

After running that to reload the data saved just after the initial data load (including H2 and ElasticSearch data) and run a specific component's tests (like mantle-usl), just run:

$ ./gradlew reloadsave startel runtime:component:mantle-usl:test stopel

After running a build, load, etc through whatever approach you prefer just start Moqui and it starts and stops ElasticSearch:

$ java -jar moqui.war

Those are examples of common things to do in local development and can vary depending on your preferred process and Gradle tasks.

Support for single database configuration was added for easier Docker, etc deployment and can be used in any environment. This is an alternative to adding database configuration in the runtime Moqui Conf XML file as described in the next section.

Each of these can be system environment variables (with underscores) or Java properties (with underscores or dots) using the -D command-line argument.

The JDBC driver for the desired database must be on the classpath. The jar file can be added to the runtime/lib directory (within the moqui-plus-runtime.war file if used) or on the command line. In Docker images the runtime/lib directory within the container can be mapped to a directory on the host for convenience (along with runtime/conf and many other directories).

Note that the 'mysql' database configuration also works with MariaDB and Percona.

Environment variables are a convenient way to configure the database when using pre-built WAR files with runtime included or Docker images.

To configure the ElasticSearch client built into Moqui Framework use the following environment variables:

Another set of common environment variables to use is for URL writing, locale, time zone, etc:

Database (or datasource) setup is done in the Moqui Conf XML file with moqui-conf.entity-facade.datasource elements. There is one element for each entity group and the datasource.@group-name attribute matches against entity.@group-name attribute in entity definitions. By default in Moqui there are 4 entity groups: transactional, nontransactional, configuration, and analytical. If you only configure a datasource for the transactional group it will also be used for the other groups.

Here is the default configuration for the H2 database:

The database-conf-name attribute points to a database configuration and matches against a database-list.database.@name attribute to identify which. Database configurations specify things like SQL types to use, SQL syntax options, and JDBC driver details.

This example uses a xa-properties element to use the XA (transaction aware) interfaces in the JDBC driver. The attribute on the element are specific to each JDBC driver. Some examples for reference are included in the MoquiDefaultConf.xml file, but for a full list of options look at the documentation for the JDBC driver.

The JDBC driver must be in the Java classpath. The easiest way get it there, regardless of deployment approach, is to put it in the runtime/lib directory.

Here is an example of a XA configuration for MySQL:

To use something like this put the datasource element under the entity-facade element in the runtime Moqui Conf XML file (like the MoquiProductionConf.xml file).

For more examples and details about recommended configuration for different databases see the comments in the MoquiDefaultConf.xml file:

https://github.com/moqui/moqui-framework/blob/master/framework/src/main/resources/MoquiDefaultConf.xml

The default Dockerfile and a script to build a Docker image based on the moqui-plus-runtime.war file are in the moqui/docker/simple directory which you can see on GitHub here:

https://github.com/moqui/moqui-framework/tree/master/docker/simple

For example after adding all components, JDBC drivers, and anything else you want in your runtime directory do something like:

On the server where the image will run make sure Docker (docker-ce) and Docker Compose (docker-compose) are installed and then pull the image created above. There are various Docker Compose examples in the moqui/docker directory:

https://github.com/moqui/moqui-framework/tree/master/docker

You'll need to create a custom compose YAML file based on one of these. This is where you put database, host, and other settings and is where you specify the image to use (like mygroup/myrepo above). To pull your image and start it up along with other Docker images for other needed applications (nginx, mysql or postgres, etc) do something like:

There is also a compose-down.sh script to bring down an instance. For updates after running docker pull you can run compose-up.sh without running compose-down.sh first and Docker Compose will simply update the containers with new images versions.

You may want to modify the compose-up.sh script and others to fit your specific deployment, including configuration and other Moqui runtime files you want to live on the Docker host instead of in a container (to survive updates, use configuration, etc). Generally when setting up a new Docker server it is recommended to create a private git repository to use as a shell for your Docker deployment. This would contain your compose up/down scripts, your compose YML file(s), and a runtime directory with any additional configuration files, components, JDBC jars, etc.

The recommended approach for deployment with AWS ElasticBeanstalk is to use a 'Java SE' environment. A Tomcat environment can be used by simply uploading a moqui-plus-runtime.war file but there are issues with this approach in that it is less flexible, Tomcat settings need to be adjusted for capacity, various changes are needed to support websocket, and so on. Using a Java SE environment with the embedded Jetty web server generally runs better and has various defaults already in place that are recommended for Moqui, plus full control of the command line to start the server to adjust servlet threads, port, Moqui XML Conf file to use, etc.

In a AWS EB Java SE environment you'll have a nginx proxy already in place that by default expects the application to be running on port 5000. The Java SE environment is used by uploading an application archive containing files for the application(s) and to tell the Java SE environment what to do. Since Moqui Framework 2.1.1 there is a Procfile included that will be added to the moqui-plus-runtime.war file. By default it contains:

Note that it does not contain memory options so that they may be set with the JAVA_TOOL_OPTIONS environment variable. For example set it to "-Xmx1024m -Xms1024m" for a 1024 MB Java heap. The heap size on a dedicated instance should be about 1/2 the total system memory (leaving room for off-heap Java memory usage and operating system memory usage).

The 'run-es' argument tells the MoquiStart class to run ElasticSearch if installed in runtime/elasticsearch. To install the Linux, Mac, or Windows no-JDK version of ElasticSearch download and expand the archive manually in runtime/elasticsearch or use the Gradle download task:

The archive to deploy is basically just the moqui-plus-runtime.war file. The WAR file must be renamed from .war to .zip so that the AWS Java SE environment treats it like a plain archive and not an executable jar. To build a file to upload to AWS ElasticBeanstalk do something like:

Then upload the ZIP file in the Elastic Beanstalk section of the AWS Console when you create your Java SE environment.

You'll also need to set various environment variables in your Elastic Beanstalk settings (under Configuration => Software Configuration) for database, host, and other settings. See the Environment Variables section above for a list of which to set.

Typically these settings will include host and other database information for a RDS instance running MySQL, Postgres, or other. Make sure the VPC Security Group for the RDS instance (automatically created when you create the DB instance) has an inbound rule with a VPC Security Group that your Elastic Beanstalk configuration is in (specified in Configuration => Instance). This is done in the VPC section of the AWS Console under Security Groups.

The smallest recommended servers to use are t2.small for the EC2 instance and t2.micro for the RDS instance for a total cost generally under $40/mo depending whether a reserved instance is used, how much disk space is used, etc. Note that for larger EC2 instances make sure to adjust the Procfile so that the maximum heap size is higher, usually roughly half of total memory for the instance if there is nothing else running on it.

The main place to put your components is in the runtime/component directory. When you use the Gradle get component tasks this is where they will go.

Components with declared dependencies (in a component.xml file in the component directory) will be loaded after the component(s) they depend on.

**Examples:**

Example 1 (unknown):
```unknown
<datasource group-name="transactional" database-conf-name="h2" schema-name=""
        start-server-args="-tcpPort 9092 -ifExists -baseDir ${moqui.runtime}/db/h2">
    <!-- with this setup you can connect remotely using "jdbc:h2:tcp://localhost:9092/MoquiDEFAULT" -->
    <inline-jdbc pool-minsize="5" pool-maxsize="50">
        <xa-properties url="jdbc:h2:${moqui.runtime}/db/h2/MoquiDEFAULT" user="sa" password="sa"/>
    </inline-jdbc>
</datasource>
```

Example 2 (unknown):
```unknown
<datasource group-name="transactional" database-conf-name="h2" schema-name=""
        start-server-args="-tcpPort 9092 -ifExists -baseDir ${moqui.runtime}/db/h2">
    <!-- with this setup you can connect remotely using "jdbc:h2:tcp://localhost:9092/MoquiDEFAULT" -->
    <inline-jdbc pool-minsize="5" pool-maxsize="50">
        <xa-properties url="jdbc:h2:${moqui.runtime}/db/h2/MoquiDEFAULT" user="sa" password="sa"/>
    </inline-jdbc>
</datasource>
```

Example 3 (unknown):
```unknown
<datasource group-name="transactional" database-conf-name="mysql" schema-name="">
    <inline-jdbc pool-minsize="5" pool-maxsize="50">
        <xa-properties user="moqui" password="CHANGEME" pinGlobalTxToPhysicalConnection="true"
                serverName="127.0.0.1" port="3306" databaseName="moqui" autoReconnectForPools="true"
                useUnicode="true" encoding="UTF-8"/>
    </inline-jdbc>
</datasource>
```

Example 4 (unknown):
```unknown
<datasource group-name="transactional" database-conf-name="mysql" schema-name="">
    <inline-jdbc pool-minsize="5" pool-maxsize="50">
        <xa-properties user="moqui" password="CHANGEME" pinGlobalTxToPhysicalConnection="true"
                serverName="127.0.0.1" port="3306" databaseName="moqui" autoReconnectForPools="true"
                useUnicode="true" encoding="UTF-8"/>
    </inline-jdbc>
</datasource>
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/System+Interfaces/Data+and+Logic+Level+Interfaces

**Contents:**
      - Wiki Spaces
      - Page Tree
- Data and Logic Level Interfaces

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

System interfaces can generally be divided into two main categories of supporting a step in a process and transferring data (often to keep data updated in another system). For most system integrations a process level one is more flexible and also more focused on a specific part of the system as opposed to transferring all data. Sometimes keeping data consistent between systems is the nature of the integration requirement or the only option available, and then a data level integration is the way to go. Moqui has tools for both logic/process and data level system interfaces.

The best way to trigger outgoing messages is through ECA (event-condition-action) rules, either Service ECA (SECA) rules for a logic level interface or Entity ECA (EECA) rules for a data level interface. See the Service ECA Rules and Entity ECA Rules sections for details on how to define these.

All ECA rules call actions, typically one or more service-call actions, and those actions will call out to whatever system interface is needed. This may be custom code or simply calling an already existing local or remote service. The following sections describe specific tools available in Moqui and with custom code you can implementation any interface and use any additional libraries needed.

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/System+Interfaces/System+Message

**Contents:**
      - Wiki Spaces
      - Page Tree
- System Message
- Introduction
- Recommended Practices
  - Incoming Messages
  - Outgoing Messages

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

The System Message functionality in Moqui Framework handles message queuing and processing for both incoming and outgoing messages.

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/User+Interface/XML+Form

**Contents:**
      - Wiki Spaces
      - Page Tree
- XML Form
- Form Field
- Field Widgets
- Single Form
  - Single Form Example
- List Form
  - List Form View/Export Example
  - List Form Edit Example

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

There are two types of XML Form: single and list. A single form represents a single set of fields with a label and widget for each. A list form is presented as a table with a column for each field, the label in the table header, a widget for the field in each row, and a row for each entry in the list the form output is based on.

While there are other ways to get data, most commonly a single form gets field values from a Map and a list form from a List of Maps.

A XML Form is like a XML Screen in that they are both rendered using a FTL macro for each element, and both support multiple render modes. Just like with XML Screen widgets you can add your own widgets by adding macros for them. The XML Form macros go in the same FTL file as the XML Screen macros, so use the same approach to add custom macros.

The main element in a form is the field, identified by its name attribute. When a form extends another form fields are overridden by using the same field name. For HTML output this is also the name of the HTML form field. The name is also used as the map key or parameter name (if no map key value found, or when there is an error submitting the form) to get the field value from. To get the field value from somewhere else in the context, and still use the name for the parameter when applicable, use the entry-name attribute which can be any Groovy expression that evaluates to the value desired.

For automatic client-side validation in generated HTML based on a service parameter you can use the validate-service and validate-parameter attributes on the field element. When the form field is automatically defined based on a service using the auto-fields-service element these two attributes will be populated automatically. The XML Form renderer will also look at the transition the form submits to and if it has a single service-call element (as opposed to processing input using an actions element) it will look for a service input parameter with a name matching the field name and use its validations.

The field type or "widget" (visual/interactive element) of a field goes under a subelement of the field element. The default widget to use goes under the default-field subelement and all fields should have one (and only one). If you want different widgets to be used in specific conditions use the conditional-field element with a Groovy expression that evaluates to a boolean in the condition attribute. This works for both single and list forms, and for list forms is evaluated for each row.

There is also a field.header-field subelement for a widget that goes in the header row of list forms. When used these header field widgets are part of a separate form that is meant to be used for search options. Sort/order links naturally go along with search options in the list form header and these can be turned on by setting the header-field.show-order-by attribute to true or case-insensitive.

A field’s title comes from the default-field.title attribute unless there is a header-field element, then it comes from the title attribute on that element. The default-field element also has a tooltip attribute which shows as a popup tooltip when focused on or hovering over the field (specific behavior depends on the HTML generated or other specific form rendering).

It is often nice when date values are red when a from date has not been reached or after a thru date. This is controlled using the default-field.red-when attribute, which by default is by-name meaning if the field name is fromDate then the field is red when the date is in the future and if the field name is thruDate then the field is red when the date is in the past. The red-when attribute can also be before-now, after-now, and never.

There are a number of OOTB widgets for form fields, and additional widgets can be added using the extension mechanism described for screens in the Macro Templates and Custom Elements section.

Any of the widgets usable in screens can be used in XML Form fields (see the XML Screen Widgets section). There are also various widgets that are specific to form fields. Here is a summary of the OOTB field widgets in Moqui:

Use the form-single element to define a single form. These are the attributes of the form-single element:

To layout fields in a way other than a plain list of fields use the form-single.field-layout element. For HTML output there is an optional id attribute to facilitate styling. If the field layout contains field groups set the collapsible attribute to true to use an accordion widget to save space, optionally specifying the active group index instead of the first to be initially open. Here are the subelements to define a layout:

To get a better idea of the utility of different aspects of a single form let’s look at a more complex example. This form is the Edit Task screen from the HiveMind Project Manager application.

This form has examples of the following (see the full source below):

Use the form-list element to define a single form. These are the attributes of the form-list element:

Similar to field-layout in a single form there is a form-list-column element for list forms. When used there needs to be one element for each column in the list form table, and all fields must be referenced in a column or they will not be rendered. The form-list-column element has a single subelement, the same field-ref element that is used in the single form field-layout.

Data preparation for a form is best done in the actions in the XML Screen it is used in but sometimes you need to prepare data for each row in a list form. This can be done by preparing in advance a List of Map objects that have entries for each list form field. With this approach the logic that prepares the List can do additional data lookups or calculations to prepare the data. The other approach is to put XML Actions under the form-list.row-actions element. These actions will be run for each row in an isolated context so that any context fields defined will be used only for that row.

There are two main categories of list forms: those used for searching, viewing, and exporting and those used for editing a number of records in a single screen.

The Artifact Summary screens in the Moqui Tools application is a good example of a screen that is used for searching, viewing data, and exporting results to CSV, XML, and PDF files all using the same screen and form definition. The list form on the screen shows a row for each artifact with a summary of the moqui.server.ArtifactHitBin records for that artifact using the moqui.server.ArtifactHitReport view-entity.

Note the "Get as CSV" link in the upper-left corner (and the similar XML and PDF links). This link goes to the simple ArtifactHitSummaryStats.csv transition that goes to the same screen and adds renderMode=csv, pageNoLimit=true, and lastStandalone=true parameters so that the screen renders with csv output instead of html, pagination is disabled (all results are output), and only the last screen is rendered (skipping all parent screens to avoid decoration, i.e. the last screen is "standalone"). See the XML, CSV and Plain Text Handling section for more detail.

Below the "Get as" links are the pagination controls which are enabled by default and by default shown when there is more than one page of results to display. In the form header row are the column titles and "+-" links for sorting the results in each column, plus a header find form with a drop-down for the Artifact Type and a text-find box for Artifact Name. These are all defined in the header-field elements under each field.

This form uses form-list.row-actions element to calculate the averageTime for each row, which is then displayed using a form field.

Here is the source for the ArtifactHitSummary.xml screen showing the details for the summary above:

The Entity Fields Localization screen in the Moqui Tools application is a good example of a list form used to update multiple records in a single page. This screen is designed for adding, editing, and deleting moqui.basic.LocalizedEntityField records that specify localized text to use instead of an entity record field’s actual value.

In the screenshot below there is a button in the upper-left corner to add a new record in a container-dialog modal popup. Just below that are the pagination controls which are enabled by default. The header row in the form has the field titles (in this case all generated based on the field name since there are no header-field.title attributes), the "+-" sorting links (with header-field.show-order-by=true), and header widgets for the fields to find only matching records.

The body rows of the list form table have one row for each record with a Delete button, but the Update button is at the bottom and updates all rows in a single form submission to update a number of Localized values at once. Notice that the Find button in the header row is in the same column as the Delete button on each body row. To do this in the form definition the Find button is defined in a subelement of the header-field element for the delete field.

Below is the source for the EntityFields.xml screen. The create, update, and delete transitions use implicitly defined entity-auto services so there is no service definition or implementation for them. This functionality relies on only a XML Screen file and the definition of the LocalizedEntityField entity.

**Examples:**

Example 1 (unknown):
```unknown
<screen xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/xml-screen-1.4.xsd"
  default-menu-title="Task" default-menu-index="1">
  <parameter name="workEffortId"/>
  <transition name="updateTask">
    <service-call name="mantle.work.TaskServices.update#Task"
      in-map="context"/>
    <default-response url="."/>
  </transition>
  <transition name="editProject">
    <default-response url="../../Project/EditProject"/>
  </transition>
  <transition name="milestoneSummary">
    <default-response url="../../Project/MilestoneSummary"/>
  </transition>
  <transition name="getProjectMilestones">
    <actions>
      <service-call in-map="context" out-map="context"
        name="mantle.work.ProjectServices.get#ProjectMilestones"/>
      <script>ec.web.sendJsonResponse(resultList)</script>
    </actions>
    <default-response type="none"/>
  </transition>
  <transition name="getProjectTasks">
    <actions>
      <service-call in-map="context" out-map="context"
        name="mantle.work.ProjectServices.get#ProjectTasks"/>
      <script>ec.web.sendJsonResponse(resultList)</script>
    </actions>
    <default-response type="none"/>
  </transition>
  <actions>
    <entity-find-one entity-name="mantle.work.effort.WorkEffort"
      value-field="task"/>
    <entity-find-one entity-name="mantle.work.effort.WorkEffort"
      value-field="project">
      <field-map field-name="workEffortId" from="task.rootWorkEffortId"/>
    </entity-find-one>
    <entity-find entity-name="mantle.work.effort.WorkEffortAssoc"
      list="milestoneAssocList">
      <date-filter/>
      <econdition field-name="toWorkEffortId" from="task.workEffortId"/>
      <econdition field-name="workEffortAssocTypeEnumId"
        value="WeatMilestone"/>
    </entity-find>
    <set field="milestoneAssoc" from="milestoneAssocList?.getAt(0)"/>
    <set field="statusFlowId"
      from="(task.statusFlowId ?: project.statusFlowId) ?: 'Default'"/>
  </actions>
  <widgets>
    <form-single name="EditTask" transition="updateTask" map="task">
      <field name="workEffortId">
        <default-field title="Task ID">
          <display/>
        </default-field>
      </field>
      <field name="rootWorkEffortId">
        <default-field title="Project">
          <drop-down>
            <entity-options key="${workEffortId}"
              text="${workEffortId}: ${workEffortName}">
              <entity-find entity-name="WorkEffortAndParty">
                <date-filter/>
                <econdition field-name="partyId"
                  from="ec.user.userAccount.partyId"/>
                <econdition field-name="workEffortTypeEnumId"
                  value="WetProject"/>
              </entity-find>
            </entity-options>
          </drop-down>
          <link text="Edit ${project.workEffortName} [${task.rootWorkEffortId}]"
            url="editProject">
          <parameter name="workEffortId" from="task.rootWorkEffortId"/>
          </link>
        </default-field>
      </field>
      <field name="milestoneWorkEffortId"
        entry-name="milestoneAssoc?.workEffortId">
        <default-field title="Milestone">
          <drop-down combo-box="true">
            <dynamic-options transition="getProjectMilestones"
              value-field="workEffortId" label-field="milestoneLabel">
              <depends-on field="rootWorkEffortId"/>
            </dynamic-options>
          </drop-down>
          <link url="milestoneSummary"
            text="${milestoneAssoc ? 'Edit ' + milestoneAssoc.workEffortId : ''}">
          <parameter name="milestoneWorkEffortId"
            from="milestoneAssoc?.workEffortId"/>
          </link>
        </default-field>
      </field>
      <field name="parentWorkEffortId">
        <default-field title="Parent Task">
          <drop-down combo-box="true">
            <dynamic-options transition="getProjectTasks"
              value-field="workEffortId" label-field="taskLabel">
              <depends-on field="rootWorkEffortId"/>
            </dynamic-options>
          </drop-down>
        </default-field>
      </field>
      <field name="workEffortName">
        <default-field title="Task Name">
          <text-line/>
        </default-field>
      </field>
      <field name="priority">
        <default-field>
          <widget-template-include location="component://HiveMind/template/
            screen/ProjectWidgetTemplates.xml#priority"/>
        </default-field>
      </field>
      <field name="purposeEnumId">
        <default-field title="Purpose">
          <widget-template-include location="component://webroot/template/
            screen/BasicWidgetTemplates.xml#enumWithParentDropDown">
            <set field="enumTypeId" value="WorkEffortPurpose"/>
            <set field="parentEnumId" value="WetTask"/>
          </widget-template-include>
        </default-field>
      </field>
      <field name="statusId">
        <default-field title="Status">
          <widget-template-include location="component://webroot/template/screen/BasicWidgetTemplates.xml#statusTransitionWithFlowDropDown">
            <set field="currentDescription"
              from="task?.'WorkEffort#moqui.basic.StatusItem'?.description"/>
            <set field="statusId" from="task.statusId"/>
          </widget-template-include>
        </default-field>
      </field>
      <field name="resolutionEnumId">
        <default-field title="Resolution">
          <widget-template-include location="component://webroot/template/
            screen/BasicWidgetTemplates.xml#enumDropDown">
            <set field="enumTypeId" value="WorkEffortResolution"/>
          </widget-template-include>
        </default-field>
      </field>
      <field name="estimatedCompletionDate">
        <default-field title="Due Date">
          <date-time type="date" format="yyyy-MM-dd"/>
        </default-field>
      </field>
      <field name="estimatedWorkTime">
        <default-field title="Estimated Hours">
          <text-line size="5"/>
        </default-field>
      </field>
      <field name="remainingWorkTime">
        <default-field title="Remaining Hours">
          <text-line size="5"/>
        </default-field>
      </field>
      <field name="actualWorkTime">
        <default-field title="Actual Hours">
          <display format="#.00"/>
        </default-field>
      </field>
      <field name="description">
        <default-field title="Description">
          <text-area rows="20" cols="100"/>
        </default-field>
      </field>
      <field name="submitButton">
        <default-field title="Update">
          <submit/>
        </default-field>
      </field>
      <field-layout>
        <fields-not-referenced/>
        <field-row>
          <field-ref name="purposeEnumId"/>
          <field-ref name="priority"/>
        </field-row>
        <field-row>
          <field-ref name="statusId"/>
          <field-ref name="estimatedCompletionDate"/>
        </field-row>
        <field-row>
          <field-ref name="estimatedWorkTime"/>
          <field-ref name="remainingWorkTime"/>
        </field-row>
        <field-ref name="actualWorkTime"/>
        <field-ref name="description"/>
        <field-ref name="submitButton"/>
      </field-layout>
    </form-single>
  </widgets>
</screen>
```

Example 2 (unknown):
```unknown
<screen xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/xml-screen-1.4.xsd"
  default-menu-title="Task" default-menu-index="1">
  <parameter name="workEffortId"/>
  <transition name="updateTask">
    <service-call name="mantle.work.TaskServices.update#Task"
      in-map="context"/>
    <default-response url="."/>
  </transition>
  <transition name="editProject">
    <default-response url="../../Project/EditProject"/>
  </transition>
  <transition name="milestoneSummary">
    <default-response url="../../Project/MilestoneSummary"/>
  </transition>
  <transition name="getProjectMilestones">
    <actions>
      <service-call in-map="context" out-map="context"
        name="mantle.work.ProjectServices.get#ProjectMilestones"/>
      <script>ec.web.sendJsonResponse(resultList)</script>
    </actions>
    <default-response type="none"/>
  </transition>
  <transition name="getProjectTasks">
    <actions>
      <service-call in-map="context" out-map="context"
        name="mantle.work.ProjectServices.get#ProjectTasks"/>
      <script>ec.web.sendJsonResponse(resultList)</script>
    </actions>
    <default-response type="none"/>
  </transition>
  <actions>
    <entity-find-one entity-name="mantle.work.effort.WorkEffort"
      value-field="task"/>
    <entity-find-one entity-name="mantle.work.effort.WorkEffort"
      value-field="project">
      <field-map field-name="workEffortId" from="task.rootWorkEffortId"/>
    </entity-find-one>
    <entity-find entity-name="mantle.work.effort.WorkEffortAssoc"
      list="milestoneAssocList">
      <date-filter/>
      <econdition field-name="toWorkEffortId" from="task.workEffortId"/>
      <econdition field-name="workEffortAssocTypeEnumId"
        value="WeatMilestone"/>
    </entity-find>
    <set field="milestoneAssoc" from="milestoneAssocList?.getAt(0)"/>
    <set field="statusFlowId"
      from="(task.statusFlowId ?: project.statusFlowId) ?: 'Default'"/>
  </actions>
  <widgets>
    <form-single name="EditTask" transition="updateTask" map="task">
      <field name="workEffortId">
        <default-field title="Task ID">
          <display/>
        </default-field>
      </field>
      <field name="rootWorkEffortId">
        <default-field title="Project">
          <drop-down>
            <entity-options key="${workEffortId}"
              text="${workEffortId}: ${workEffortName}">
              <entity-find entity-name="WorkEffortAndParty">
                <date-filter/>
                <econdition field-name="partyId"
                  from="ec.user.userAccount.partyId"/>
                <econdition field-name="workEffortTypeEnumId"
                  value="WetProject"/>
              </entity-find>
            </entity-options>
          </drop-down>
          <link text="Edit ${project.workEffortName} [${task.rootWorkEffortId}]"
            url="editProject">
          <parameter name="workEffortId" from="task.rootWorkEffortId"/>
          </link>
        </default-field>
      </field>
      <field name="milestoneWorkEffortId"
        entry-name="milestoneAssoc?.workEffortId">
        <default-field title="Milestone">
          <drop-down combo-box="true">
            <dynamic-options transition="getProjectMilestones"
              value-field="workEffortId" label-field="milestoneLabel">
              <depends-on field="rootWorkEffortId"/>
            </dynamic-options>
          </drop-down>
          <link url="milestoneSummary"
            text="${milestoneAssoc ? 'Edit ' + milestoneAssoc.workEffortId : ''}">
          <parameter name="milestoneWorkEffortId"
            from="milestoneAssoc?.workEffortId"/>
          </link>
        </default-field>
      </field>
      <field name="parentWorkEffortId">
        <default-field title="Parent Task">
          <drop-down combo-box="true">
            <dynamic-options transition="getProjectTasks"
              value-field="workEffortId" label-field="taskLabel">
              <depends-on field="rootWorkEffortId"/>
            </dynamic-options>
          </drop-down>
        </default-field>
      </field>
      <field name="workEffortName">
        <default-field title="Task Name">
          <text-line/>
        </default-field>
      </field>
      <field name="priority">
        <default-field>
          <widget-template-include location="component://HiveMind/template/
            screen/ProjectWidgetTemplates.xml#priority"/>
        </default-field>
      </field>
      <field name="purposeEnumId">
        <default-field title="Purpose">
          <widget-template-include location="component://webroot/template/
            screen/BasicWidgetTemplates.xml#enumWithParentDropDown">
            <set field="enumTypeId" value="WorkEffortPurpose"/>
            <set field="parentEnumId" value="WetTask"/>
          </widget-template-include>
        </default-field>
      </field>
      <field name="statusId">
        <default-field title="Status">
          <widget-template-include location="component://webroot/template/screen/BasicWidgetTemplates.xml#statusTransitionWithFlowDropDown">
            <set field="currentDescription"
              from="task?.'WorkEffort#moqui.basic.StatusItem'?.description"/>
            <set field="statusId" from="task.statusId"/>
          </widget-template-include>
        </default-field>
      </field>
      <field name="resolutionEnumId">
        <default-field title="Resolution">
          <widget-template-include location="component://webroot/template/
            screen/BasicWidgetTemplates.xml#enumDropDown">
            <set field="enumTypeId" value="WorkEffortResolution"/>
          </widget-template-include>
        </default-field>
      </field>
      <field name="estimatedCompletionDate">
        <default-field title="Due Date">
          <date-time type="date" format="yyyy-MM-dd"/>
        </default-field>
      </field>
      <field name="estimatedWorkTime">
        <default-field title="Estimated Hours">
          <text-line size="5"/>
        </default-field>
      </field>
      <field name="remainingWorkTime">
        <default-field title="Remaining Hours">
          <text-line size="5"/>
        </default-field>
      </field>
      <field name="actualWorkTime">
        <default-field title="Actual Hours">
          <display format="#.00"/>
        </default-field>
      </field>
      <field name="description">
        <default-field title="Description">
          <text-area rows="20" cols="100"/>
        </default-field>
      </field>
      <field name="submitButton">
        <default-field title="Update">
          <submit/>
        </default-field>
      </field>
      <field-layout>
        <fields-not-referenced/>
        <field-row>
          <field-ref name="purposeEnumId"/>
          <field-ref name="priority"/>
        </field-row>
        <field-row>
          <field-ref name="statusId"/>
          <field-ref name="estimatedCompletionDate"/>
        </field-row>
        <field-row>
          <field-ref name="estimatedWorkTime"/>
          <field-ref name="remainingWorkTime"/>
        </field-row>
        <field-ref name="actualWorkTime"/>
        <field-ref name="description"/>
        <field-ref name="submitButton"/>
      </field-layout>
    </form-single>
  </widgets>
</screen>
```

Example 3 (unknown):
```unknown
<screen xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/xml-screen-1.4.xsd"
  default-menu-title="Artifact Summary">
  <transition name="ArtifactHitSummaryStats.csv">
    <default-response url=".">
      <parameter name="renderMode" value="csv"/>
      <parameter name="pageNoLimit" value="true"/>
      <parameter name="lastStandalone" value="true"/>
    </default-response>
  </transition>
  <transition name="ArtifactHitSummaryStats.xml">
    <default-response url=".">
      <parameter name="renderMode" value="xml"/>
      <parameter name="pageNoLimit" value="true"/>
      <parameter name="lastStandalone" value="true"/>
    </default-response>
  </transition>
  <transition name="ArtifactHitSummaryStats.pdf">
    <default-response url-type="plain"
      url="${ec.web.getWebappRootUrl(false, null)}/fop/apps/tools/System/
      ArtifactHitSummary">
      <parameter name="renderMode" value="xsl-fo"/>
      <parameter name="pageNoLimit" value="true"/>
    </default-response>
  </transition>
  <actions>
    <entity-find entity-name="moqui.server.ArtifactHitReport"
      list="artifactHitReportList" limit="50">
      <search-form-inputs default-order-by="artifactType,artifactName"/>
    </entity-find>
  </actions>
  <widgets>
    <container>
      <link url="ArtifactHitSummaryStats.csv" text="Get as CSV"
        target-window="_blank" expand-transition-url="false"/>
      <link url="ArtifactHitSummaryStats.xml" text="Get as XML"
        target-window="_blank" expand-transition-url="false"/>
      <link url="ArtifactHitSummaryStats.pdf" text="Get as PDF"
        target-window="_blank"/>
    </container>
    <form-list name="ArtifactHitSummaryList" list="artifactHitReportList">
      <row-actions>
        <set field="averageTime" from="(totalTimeMillis/hitCount as
          BigDecimal).setScale(0,BigDecimal.ROUND_UP)"/>
      </row-actions>
      <field name="artifactType">
        <header-field show-order-by="true">
          <drop-down allow-empty="true">
            <option key="screen"/>
            <option key="screen-content"/>
            <option key="transition"/>
            <option key="service"/>
            <option key="entity"/>
          </drop-down>
        </header-field>
        <default-field><display also-hidden="false"/></default-field>
      </field>
      <field name="artifactName">
        <header-field show-order-by="true">
          <text-find hide-options="true" size="20"/>
        </header-field>
        <default-field>
          <display text="${artifactName}"
            also-hidden="false"/>
        </default-field>
      </field>
      <field name="lastHitDateTime">
        <header-field title="Last Hit" show-order-by="true"/>
        <default-field>
          <display also-hidden="false"/>
        </default-field>
      </field>
      <field name="hitCount">
        <header-field title="Hits" show-order-by="true"/>
        <default-field>
          <display also-hidden="false"/>
        </default-field>
      </field>
      <field name="minTimeMillis">
        <header-field title="Min" show-order-by="true"/>
        <default-field>
          <display also-hidden="false"/>
        </default-field>
      </field>
      <field name="averageTime">
        <default-field title="Avg">
          <display also-hidden="false"/>
        </default-field>
      </field>
      <field name="maxTimeMillis">
        <header-field title="Max" show-order-by="true"/>
        <default-field>
          <display also-hidden="false"/>
        </default-field>
      </field>
      <field name="find">
        <header-field title="Find">
          <submit/>
        </header-field>
      </field>
    </form-list>
  </widgets>
</screen>
```

Example 4 (unknown):
```unknown
<screen xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/xml-screen-1.4.xsd"
  default-menu-title="Artifact Summary">
  <transition name="ArtifactHitSummaryStats.csv">
    <default-response url=".">
      <parameter name="renderMode" value="csv"/>
      <parameter name="pageNoLimit" value="true"/>
      <parameter name="lastStandalone" value="true"/>
    </default-response>
  </transition>
  <transition name="ArtifactHitSummaryStats.xml">
    <default-response url=".">
      <parameter name="renderMode" value="xml"/>
      <parameter name="pageNoLimit" value="true"/>
      <parameter name="lastStandalone" value="true"/>
    </default-response>
  </transition>
  <transition name="ArtifactHitSummaryStats.pdf">
    <default-response url-type="plain"
      url="${ec.web.getWebappRootUrl(false, null)}/fop/apps/tools/System/
      ArtifactHitSummary">
      <parameter name="renderMode" value="xsl-fo"/>
      <parameter name="pageNoLimit" value="true"/>
    </default-response>
  </transition>
  <actions>
    <entity-find entity-name="moqui.server.ArtifactHitReport"
      list="artifactHitReportList" limit="50">
      <search-form-inputs default-order-by="artifactType,artifactName"/>
    </entity-find>
  </actions>
  <widgets>
    <container>
      <link url="ArtifactHitSummaryStats.csv" text="Get as CSV"
        target-window="_blank" expand-transition-url="false"/>
      <link url="ArtifactHitSummaryStats.xml" text="Get as XML"
        target-window="_blank" expand-transition-url="false"/>
      <link url="ArtifactHitSummaryStats.pdf" text="Get as PDF"
        target-window="_blank"/>
    </container>
    <form-list name="ArtifactHitSummaryList" list="artifactHitReportList">
      <row-actions>
        <set field="averageTime" from="(totalTimeMillis/hitCount as
          BigDecimal).setScale(0,BigDecimal.ROUND_UP)"/>
      </row-actions>
      <field name="artifactType">
        <header-field show-order-by="true">
          <drop-down allow-empty="true">
            <option key="screen"/>
            <option key="screen-content"/>
            <option key="transition"/>
            <option key="service"/>
            <option key="entity"/>
          </drop-down>
        </header-field>
        <default-field><display also-hidden="false"/></default-field>
      </field>
      <field name="artifactName">
        <header-field show-order-by="true">
          <text-find hide-options="true" size="20"/>
        </header-field>
        <default-field>
          <display text="${artifactName}"
            also-hidden="false"/>
        </default-field>
      </field>
      <field name="lastHitDateTime">
        <header-field title="Last Hit" show-order-by="true"/>
        <default-field>
          <display also-hidden="false"/>
        </default-field>
      </field>
      <field name="hitCount">
        <header-field title="Hits" show-order-by="true"/>
        <default-field>
          <display also-hidden="false"/>
        </default-field>
      </field>
      <field name="minTimeMillis">
        <header-field title="Min" show-order-by="true"/>
        <default-field>
          <display also-hidden="false"/>
        </default-field>
      </field>
      <field name="averageTime">
        <default-field title="Avg">
          <display also-hidden="false"/>
        </default-field>
      </field>
      <field name="maxTimeMillis">
        <header-field title="Max" show-order-by="true"/>
        <default-field>
          <display also-hidden="false"/>
        </default-field>
      </field>
      <field name="find">
        <header-field title="Find">
          <submit/>
        </header-field>
      </field>
    </form-list>
  </widgets>
</screen>
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/The+Tools+Application/Auto+Screen

**Contents:**
      - Wiki Spaces
      - Page Tree
- Auto Screen
- Entity List
- Find Entity
- Edit Entity
- Edit Related

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

Auto screens are based on entity definitions and use the default forms generated by a XML Form with auto form fields based on the fields for a given entity. There are screens to find and create values, edit exiting values, and view related values for an entity.

The main entity list for auto screens has a drop-down at the top with all entities plus a list of the master entities to select from. Master entities are entities with dependents and are the most useful to find and view with a tab set for their dependent and related entities, though any entity can be used with the auto screens. Select an entity to go to its find page.

The find screen has a paginated list of records for the selected entity with Edit and Delete buttons for each, the Edit button going to the Edit Entity screen. The table has auto generated view fields based on the entity fields in a form-list. The Entity List button goes back to the list of master and all entities. The Find button pops a form with filter inputs for each entity field, and the New Value button pops up a form to create a new record.

Here is the Find form for the Geo entity that pops up.

Here is the New Value form that pops up for the Geo entity.

The edit entity screen has tabs for the current entity and all related entities. It has an auto-generated edit form (form-single) based on the entity definition, including drop-downs for fields that are foreign keys to other records. There is also a simple form at the bottom to export the record and its dependent records to a file (like the Entity Export screen). Here is an example for the USA Geo record:

When you click on a tab for a related entity from the edit screen you get a list of the related records with Edit and Delete links for each just like the Entity Find screen. It is a form-list with fields auto generated from the entity fields. You also get Entity List, Find, and New value buttons like the find screen. This example shows the Postal Address records with the same Geo (USA) set as the Country.

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/alldocs/framework

**Contents:**
      - Wiki Spaces
      - Page List

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Data+and+Resources/Entity+Data+Import+and+Export

**Contents:**
      - Wiki Spaces
      - Page Tree
- Entity Data Import and Export
- Loading Entity XML and CSV
- Writing Entity XML
- Views and Forms for Easy View and Export

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

Entity records can be imported from XML and CSV files using the EntityDataLoader. This can be done through the Entity Facade API using the* ec.entity*.makeDataLoader() method to get an object that implements the interface and using its methods to specify which data to load and then load it (using the load() method), get an EntityList of the records (using the list() method), or validate the data against the database (using the check() method).

There are a few options for specifying which data to load. You can specify one or more locations using the location(String location) and locationList(List<String> locationList) methods. You can use text directly with the xmlText(String xmlText) and csvText(String csvText) methods. You can also load from component data directories and the entity-facade.load-data elements in the Moqui Conf XML file by specifying the types of data to load (only the files with a matching type will be loaded) using the dataTypes(Set<String> dataTypes) method.

To set the transaction timeout to something different from the default, usually larger to handle processing large files, use the transactionTimeout(int tt) method. If you expect mostly inserts you can use pass true to the useTryInsert(boolean useTryInsert) method to improve performance by doing an insert without a query to see if the record exists and then if the insert fails with an error try an update.

To help with foreign keys when records are out of order, but you know all will eventually be loaded, pass true to the dummyFks(boolean dummyFks) method and it will create empty records for foreign keys with no existing record. When the real record for the FK is loaded it will simply update the empty dummy record. To disable Entity ECA rules as the data is loaded pass true to the disableEntityEca(boolean disableEeca) method.

For CSV files you can specify which characters to use when parsing the file(s) with csvDelimiter(char delimiter) (defaults to ‘,’), csvCommentStart(char commentStart) (defaults to ‘#’), and csvQuoteChar(char quoteChar) (defaults to ‘"’).

Note that all of these methods on the EntityDataLoader return a self reference so you can chain calls, i.e. it is a DSL style API. For example:

In addition to directly using the API you can load data using the* Tool* => Entity => Import screen in the tools component that comes in the default Moqui runtime. You can also load data using the command line with the executable WAR file using the *-load *argument. Here are the command line arguments available for the data loader:

load -------- Run data loader

types=<type>[,<type>] -- Data types to load (can be anything, common are: seed, seed-initial, demo, ...)

location=<location> ---- Location of data file to load

timeout=<seconds> ------ Transaction timeout for each file, defaults to 600 seconds (10 minutes)

dummy-fks -------------- Use dummy foreign-keys to avoid referential integrity errors

use-try-insert --------- Try insert and update on error instead of checking for record first

tenantId=<tenantId> ---- ID for the Tenant to load the data into

The entity data XML file must have the entity-facade-xml root element which has a type attribute to specify the type of data in the file, which is compared with the specified types (if loading by specifying types) and only loaded if the type is in the set or if all types are loaded. Under that root element each element name is an entity or service name. For entities each attribute is a field name and for services each attribute is a input parameter.

Here is an example of a entity data XML file:

Here is an example CSV file that calls a service (the same pattern applies for loading entity data):

# first line is ${entityName or serviceName},${dataType}

org.moqui.example.ExampleServices.create#Example, demo

# second line is list of field names

exampleTypeEnumId, statusId, exampleName, exampleSize, exampleDate

# each additional line has values for those fields

EXT_MADE_UP, EXST_IN_DESIGN, Test Example Name 3, 13, 2014-03-03 15:00:00

The easiest way export entity data to an XML file is to use the EntityDataWriter, which you can get with ec.entity.makeDataWriter(). Through this interface you can specify the names of entities to export from and various other options, then it does the query and exports to a file (with the int file(String filename) method), a directory with one file per entity (with the int directory(String path) method), or to a Writer object (with the int writer(Writer writer) method). All of these methods return an int with the number of records that were written.

The methods for specifying options return a self reference to enable chaining calls. These are the methods for the query and export options:

Here is an example of an export of all OrderHeader records within a time range plus their dependents:

Another way to export entity records is to do a query and get an EntityList or EntityListIterator object and call the int writeXmlText(Writer writer, String prefix, boolean dependents) method on it. This methods writes XML to the writer, optionally adding the prefix to the beginning of each element and including dependents.

Similar to the entity data import UI you can export data using the Tool => Entity => Export screen in the tools component that comes in the default Moqui runtime.

A number of tools come together to make it very easy to view and export database data that comes from a number of different tables. We have explored the options for static (XML), dynamic, and database defined entities. In the User Interface chapter there is detail about XML Forms, and in particular list forms.

When a form-list has dynamic=true and a ${} string expansion in the auto-fields-entity.entity-name attribute then it will be expanded on the fly as the screen is rendered, meaning a single form can be used to generate tabular HTML or CSV output for any entity given an entity name as a screen parameter.

To make things more interesting results viewed can be filtered generically using a dynamic form-single with an auto-fields-entity element to generate a search form based on the entity, and an entity-find with search-form-inputs to do the query based on the entity name parameter and the search parameters from the search form.

Below is an example of these features along with a transition (DbView.csv) to export a CSV file. Don’t worry too much about all the details for screens, transitions, forms, and rendering options, they are covered in detail in the User Interface section. This screen definition is an excerpt from the ViewDbView.xml screen in the tools component that comes by default with Moqui Framework:

While this screen is designed to be used by a user it can also be rendered outside a web or other UI context to generate CSV output to send to a file or other location. If you were to just write a screen for that it would be far simpler, basically just the parameter element, the single entity-find action, and the simple form-list definition. The transitions and the search form would not be needed.

The code to do this through the screen renderer would look something like:

**Examples:**

Example 1 (unknown):
```unknown
ec.entity.makeDataLoader().dataTypes([‘seed’, ‘demo’]).load()
```

Example 2 (unknown):
```unknown
ec.entity.makeDataLoader().dataTypes([‘seed’, ‘demo’]).load()
```

Example 3 (unknown):
```unknown
$ java -jar moqui.war load types=seed,demo
```

Example 4 (unknown):
```unknown
$ java -jar moqui.war load types=seed,demo
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Multi-instance+with+Docker

**Contents:**
      - Wiki Spaces
      - Page Tree
- Multi-instance Moqui with Docker
- Step 1: Configure Docker to listen to HTTP/TCP on localhost
- Step 2: Build the moqui Docker image
- Step 3: Start nginx-proxy and mysql
- Step 4: Build and run a Moqui server for Instance Management
- Step 5: Use the Instance screens to create and provision an instance
- Step 6: Check the moqui.local instance

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

The Docker daemon needs an additional -H argument such as this one for tcp:

For Linux systems Docker is often run with systemd. See this reference for details, especially the points about the ExecStart setting which should be something like the above (note that instead of the unix:// socket location your default configuration may have 'fd://' which should be left as-is, just add the -H argument for the tcp listener):

https://docs.docker.com/engine/admin/systemd/

A note for Mac OS X (macOS): Because of the way Docker runs on a Mac this is difficult to setup. Options include hacking around the Docker.app files, or using socat to forward HTTP requests to a Unix socket. It is much easier in general to work with Docker on Linux. I can't speak to Windows setups, other than noticing in the documentation that under Windows it uses HTTP/TCP by default instead of a Unix socket so it may be that no additional setup is needed.

When this runs it will bind to ports 80 and 3306 on the host system, so make sure those are free first. If you change the nginx-mysql-compose.yml file that will vary (such as setting up HTTPS on port 443).

This will start nginx-proxy and mysql server, and with the project/app name 'moqui' will create a network called 'moqui_default' that other moqui instances will use to automatically setup the virtual host reverse proxy and to connect to the database. Note that the default InstanceImageType settings for imageTypeId=moqui refer to the moqui-database container running on the same Docker network for the database. To use a different database you can change the default settings, add a new InstanceImageType, or change the corresponding AppInstanceEnv values, along with a different DatabaseHost record for the admin settings of the database server.

Note that this is NOT running in a Docker container, but on the same system as the Docker host so it can talk to the Docker host over HTTP using the settings from Step 1. Following these instructions it will run with an embedded H2 database for its own data, but will use the MySQL JDBC driver to talk to the database running in a Docker container by its exposed port (see the nginx-mysql-compose.yml file).

You can see if the instance is running from the Instances screen using the 'Check' button in the Instance column. You can also use docker directly to see if the instance is running (with 'docker ps').

To see the logs for the instance use something like 'docker logs -f moqui_local'

To resolve the moqui.local domain name add it to the system, i.e. in /etc/hosts.

Now in your browser you can go to 'http://moqui.local' and if all worked properly you will see a fresh copy of Moqui running with production settings and a database with only seed, seed-ininitial, and install data loaded. Note that there are no users yet in the system so the Login screen will show you a form to create an admin user. This should be done right away after setting up a new instance so that option is disabled.

**Examples:**

Example 1 (unknown):
```unknown
$ dockerd -H unix:///var/run/docker.sock -H tcp://127.0.0.1:2375
```

Example 2 (bash):
```bash
$ dockerd -H unix:///var/run/docker.sock -H tcp://127.0.0.1:2375
```

Example 3 (unknown):
```unknown
# starting in the moqui directory (moqui-framework root), build moqui and create the moqui-plus-runtime.war file
$ gradle cleanAll build addRuntime
# build the Docker image based on the moqui-plus-runtime.war file
$ cd docker/simple
$ ./docker-build.sh
# make sure there is an image called 'moqui'
$ docker images
```

Example 4 (bash):
```bash
# starting in the moqui directory (moqui-framework root), build moqui and create the moqui-plus-runtime.war file
$ gradle cleanAll build addRuntime
# build the Docker image based on the moqui-plus-runtime.war file
$ cd docker/simple
$ ./docker-build.sh
# make sure there is an image called 'moqui'
$ docker images
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Logic+and+Services

**Contents:**
      - Wiki Spaces
      - Page Tree
- Logic and Services

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

In this space we cover the following topics-

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/System+Interfaces/Enterprise+Integration+with+Apache+Camel

**Contents:**
      - Wiki Spaces
      - Page Tree
- Enterprise Integration with Apache Camel

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

Apache Camel (http://camel.apache.org) is a tool for routing and processing messages with tools for Enterprise Integration Patterns which are described here (and other pages on this site have much other good information about EIP): http://www.eaipatterns.com/toc.html

Moqui Framework has a Message Endpoint for Camel (MoquiServiceEndpoint) that ties it to the Service Facade. This allows services (with type=camel) to send the service call as a message to Camel using the MoquiServiceConsumer. The endpoint also includes a message producer (MoquiServiceProducer) that is available in Camel routing strings as moquiservice.

Here are some example Camel services from the ExampleServices.xml file:

When you call the localCamelExample service it calls the targetCamelExample service through Apache Camel. This is a very simple example of using services with Camel. To get an idea of the many things you can do with Camel the components reference is a good place to start:

http://camel.apache.org/components.html

The general idea is you can:

Camel is a very flexible and feature rich tool so instead of trying to document and demonstrate more here I recommend these books:

Instant Apache Camel Message Routing by Bilgin Ibryam

Apache Camel Developer's Cookbook by Scott Cranton and Jakub Korab

Camel in Action by Claus Ibsen and Jonathan Anstey

**Examples:**

Example 1 (unknown):
```unknown
<service verb="localCamelExample" type="camel"
 location="moquiservice:org.moqui.example.ExampleServices.targetCamelExample">
 <in-parameters><parameter name="testInput"/></in-parameters>
 <out-parameters><parameter name="testOutput"/></out-parameters>
</service>
<service verb="targetCamelExample">
 <in-parameters><parameter name="testInput"/></in-parameters>
 <out-parameters><parameter name="testOutput"/></out-parameters>
 <actions>
 <set field="testOutput" value="Here's the input: ${testInput}"/>
 <log level="warn"
 message="targetCamelExample testOutput: ${result.testOutput}"/>
 </actions>
</service>
```

Example 2 (unknown):
```unknown
<service verb="localCamelExample" type="camel"
 location="moquiservice:org.moqui.example.ExampleServices.targetCamelExample">
 <in-parameters><parameter name="testInput"/></in-parameters>
 <out-parameters><parameter name="testOutput"/></out-parameters>
</service>
<service verb="targetCamelExample">
 <in-parameters><parameter name="testInput"/></in-parameters>
 <out-parameters><parameter name="testOutput"/></out-parameters>
 <actions>
 <set field="testOutput" value="Here's the input: ${testInput}"/>
 <log level="warn"
 message="targetCamelExample testOutput: ${result.testOutput}"/>
 </actions>
</service>
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/docs/framework/Source+Management

**Contents:**
      - Wiki Spaces
      - Page Tree
- Source Management Guide
- Moqui Ecosystem Repositories
- Gradle Tasks for Source Management
- Add On Component Repositories and myaddons.xml
- Forking Moqui Repositories
- Command Line Examples
  - Fresh Local Setup
  - Configure Upstream for Forked Repository

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

Moqui Ecosystem is made up of dozens of repositories so you can choose the tools, business artifacts, applications, and integrations you need while not worrying about the rest. All repositories represent a component that goes in the runtime/component directory with the exception of the framework (moqui-framework) and the default runtime directory (moqui-runtime).

Moqui Framework and all other core Moqui Ecosystem repositories are hosted on GitHub. These repositories are all configured in the addons.xml file (in the root of moqui-framework repository) to make it easy to do git operations such as get/clone, pull, and status for all repositories including all components of your own you might add.

The same structure of one git repository per component is recommended for your own components as well.

Because each component is in its own git repository your local working directory will typically have a dozen or more git repositories to keep track of. To simplify working with multiple git repositories there are various Gradle tasks in the root build.gradle file in moqui-framework.

Note that Gradle matches task names by partial strings as long as they match a single task so the table below includes the full task name plus some recommended shortcuts.

To see a list of all available Gradle tasks: gradle tasks --all

Most of the Moqui tasks have descriptions with usage information including required properties. Passing properties to a Gradle task is somewhat cumbersome, done with -P<name>=<value> parameters.

The settings.gradle file in moqui-framework has a script to find all components with a build.gradle file and automatically adds them to the top level module. Because of this all common tasks such as build, test, etc will run on components automatically.

In general when working with Moqui you should keep all of your code and other artifacts in one or more add on components with a git repository for each.

Each component should declare other components it depends on using a component.xml file. This is used by the Gradle getComponent task to automatically get other needed components and it is used to make sure all dependent components are in place when Moqui starts up. Here is an example component.xml file with some dependencies:

The component name should match the directory name it lives in, which is the name of the git repository.

To tell the Gradle tasks about your component add them in a myaddons.xml file located in the moqui root directory, alongside addons.xml. This is preferred to modifying addons.xml so that your components and source repository locations and such are kept separate from the stock Moqui components and repositories.

The myaddons.xml file has the same structure as addons.xml and can be used to both add and override settings there. For example you can specify alternate repositories and components to point to your forks of any Moqui repository such as mantle-usl and SimpleScreens.

Here is a very simple example to add a single custom component:

This uses the github-ssh repository defined in addons.xml so that it is downloaded via SSH instead of by HTTPS. This is convenient when working with private repositories to avoid authentication issues. The Gradle tasks use a Git client written in Java which will generally pick up your SSH keys in the ~/.ssh directory (for Mac and Linux).

Here is an example of a more complex myaddons.xml file that overrides the location of the runtime directory and a number of stock Moqui components, along with adding custom components:

To use SSH instead of HTTPS for all components this uses the default-repository attribute along with a repository element to specify the git location for a custom repository (standard GitHub URL in this example, same as github-ssh in the stock addons.xml file).

There are many reasons you might want to fork the stock Moqui repositories. This is necessary to create pull requests on GitHub to submit contributions. You can also use this to manage your modifications to Moqui framework, runtime, and stock components and still maintain an upstream link for periodic upstream merges.

One important best practice when using Moqui is to avoid changing the stock Moqui source code and other artifacts. This makes it easier to update and is made possible by dozens of framework features that allow you to register tools, add screens to the default webroot screen tree, trigger your own services on various business events, change look and feel, and much more.

**Examples:**

Example 1 (unknown):
```unknown
myaddons.xml
```

Example 2 (unknown):
```unknown
runtime/component
```

Example 3 (unknown):
```unknown
moqui-framework
```

Example 4 (unknown):
```unknown
moqui-runtime
```

---

## Moqui Ecosystem

**URL:** https://www.moqui.org/

**Contents:**
- Moqui Ecosystem
  - open source business applications with modern architecture and full rest api
    - Framework
    - Moqui
    - Artifacts
    - Mantle
    - Applications
    - Apps
- Moquiis for
- LatestReleases

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

tools to build low-code modular enterprise apps

data model * service library * integrations * forms * screens

ERP * CRM * ecommerce * projects * more

Easy to try: apps demo, ecommerce demo, download, or build

Moqui Framework 3.0.0

Moqui Marble ERP 1.0.0

HiveMind PM and ERP 1.5.0

POP Commerce and ERP 2.2.0

Low code: less code, less cost. Less code translates to less development, maintenance, and support. The efficient and flexible Moqui Framework tools dramatically reduce your code size and complexity. The existing business artifacts (data model, services, screens/forms, integrations, etc) mean you have less to build.

How much less code? In one large project over a million lines of code was replaced with less than 100k.

The difficult made easy. Moqui Framework uses many of the best open source Java libraries plus a set of innovative tools for persistence, logic, user interfaces, and integration... all designed to work together OOTB to make your life easier.

Need to build a REST API? Easy. Need to use a REST or other API? Easy.

Need to index database records on the fly for full text search or analytics? Easy.

Need to build an integration with managed message production and consumption? Easy.

Need runtime configuration of authorization for screens, services, entities and even automatic query filtering? Easy.

Existing applications to use or customize. The existing open source applications give you a starting point for your custom or commercial applications. They are not just useful as-is but also provides hundreds of examples of how to build different UI elements and use the generic business artifacts.

Need Saas? No problem. The multi-instance features in Moqui Framework make it easy to offer your Software as a Service. With provisioning services in Moqui and subscription products in Mantle it is easy to setup an ecommerce and self-service web site for access to your software. Each instance runs in its own container or VM and with its own database. Provisioning services are included for Docker and MySQL. There are service interfaces you can implement for any host environment or database.

Easy to deploy. Applications built on Moqui Framework can be distributed as a standalone executable archive or a standard WAR file (with runtime configuration and add-ons separate or embedded). This makes it easy to deploy on virtual machines, container based infrastructure, on-premise and in private clouds. For large deployments Moqui supports session replication, distributed caching, and much more to scale up application server pools.

Moqui is free and open source software, released in the public domain.

To firmly establish this and to clarify terms in jurisdictions where public domain status is not recognized, Moqui uses the Creative Commons CC0 1.0 Universal Public Domain Dedication.

Because CC0 1.0 does not cover patent issues, the Moqui Ecosystem projects also use a Grant of Patent License adapted from Apache License 2.0. See the full details in the LICENSE and AUTHORS files.

To maintain a high level of quality and provide for long-term sustainable maintenance Moqui is operated using a professionally moderated code base model. This model is based on free-market principles and takes in account the motivations and needs of all parties involved:

No changes go into the official code repository without detailed personal review by one of the moderators. It is common for users of software to want certain things to be different, or new things to be added. Under this model the normal way to get this done is to work with a moderator to either implement the desired changes, or review a patch from the contributor, make revisions as needed, and then commit the changes.

Under this model: users get a piece of software that is well thought out and thoroughly reviewed users save time wasted by meaningless changes causing them problems users don't have to worry about bad changes being committed without thorough review users can count on software that will be around for a long time contributors don't wait endlessly for feedback or worry about contributions being ignored contributors can count on detailed feedback and, as needed, discussion and collaboration to get the best possible change committed, or a good explanation of why it won't be sponsors enjoy fast response times to requests for new features or other changes the software stays aligned with design goals the software does not suffer from decay over many years of life as random people scratch random itches or commit for convenience based on requirements for particular projects

users get a piece of software that is well thought out and thoroughly reviewed users save time wasted by meaningless changes causing them problems users don't have to worry about bad changes being committed without thorough review users can count on software that will be around for a long time contributors don't wait endlessly for feedback or worry about contributions being ignored contributors can count on detailed feedback and, as needed, discussion and collaboration to get the best possible change committed, or a good explanation of why it won't be sponsors enjoy fast response times to requests for new features or other changes the software stays aligned with design goals the software does not suffer from decay over many years of life as random people scratch random itches or commit for convenience based on requirements for particular projects

---

## Moqui Documentation

**URL:** https://www.moqui.org/docs/framework

**Contents:**
      - Wiki Spaces
      - Page Tree
- Moqui Framework

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

This space contains documentation about Moqui Framework. It is more technical in nature, meant for developers and IT staff.

If you're just getting started with Moqui the recommended reading order for these documents is:

Before you begin a larger project or do more significant development these documents will be helpful:

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/User+Interface/Client+Rendered+Vue+Screen

**Contents:**
      - Wiki Spaces
      - Page Tree
- Client Rendered Vue Screen

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

In the vuet render mode (under /vapps in the OOTB applications) XML Screens normally use a hybrid of client and server rendering. Screens can also be build that are 100% client rendered with a Vue JS component (.js file) and an embedded or separate Vue template (.vuet file).

Here is an example screen definition:

DynamicExampleItems.xml

The most important differences from a normal XML Screen are:

Under the screen.widgets element there is a single render-mode element with a text element for type="js" and another for type="vuet" since this has a separate Vue template file. Here are direct links to the .js and .vuet files:

ExampleItems.js ExampleItems.vuet

This is a very simple example with an add form and a list of items. The add form demonstrate Vue component data binding and a method to handle the form submit in the browser. The list of items demonstrates iterating over a list that is loaded from the server with an jQuery.ajax() call.

With this approach the screen runs in the context of the WebrootVue root component which handle routing and various other things. As with standard Vue JS that can be referenced in other components using this.$root which is how the .js script in this example gets the exampleId parameter from the currentParameters object in the WebrootVue component.

Vue components used in Moqui vuet templates can also be used, such as the drop-down component used in this example (which supports data binding with the v-model attribute).

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/System+Interfaces/XML+CSV+and+Plain+Text+Handling

**Contents:**
      - Wiki Spaces
      - Page Tree
- XML, CSV and Plain Text Handling

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

There are various ways to produce and consume XML, CSV, JSON, and other text data using Moqui Framework.

Groovy has a good API for producing and consuming XML with:

There are many other XML libraries written in Java that be used with Moqui such as dom4j and JDOM. If you prefer these just include the JAR files in the Gradle build and code away.

For CSV files Moqui uses the Apache Commons CSV library, and just like with XML files other libraries can be used too. You can see how Moqui uses this in the org.moqui.impl.entity.EntityDataLoaderImpl.EntityCsvHandler class.

In Moqui Framework the main tool for repotting and exporting data is the XML Form, especially the list form. XML Screens and Forms can be rendered in various modes including XML, CSV, and plain text. To do this set the renderMode field in the context either in screen actions or for web requests with a request parameter. This is matched against the screen-facade.screen-text-output.type attribute in the Moqui Conf XML file and can be set to any value defined there, including the default Moqui ones (csv, html, text, xml, xsl-fo) or any that you define in your runtime Moqui Conf XML file.

The XML Form is probably setup for pagination (this is the default). To get all results instead of pagination for an export (or any other reason) set the pageNoLimit field to true. In some cases you will not want to render any of the parent screens that normally decorate the final screen to render, especially for XML files. For CSV files other screen elements are generally ignored. This can be done by setting the lastStandalone field to true meaning that the last screen is rendered standalone and not within parent screens in the screen path. These can be set in screen actions of for web requests as a request parameter.

Just as with other XML Screen and XML Form output modes the FTL macro template used to produce output can be customized by include and override/add. With this approach you can get custom output for a particular screen (including subscreens, so for an entire app or app section, etc) or for everything running in Moqui.

For a detailed example of a screen and form that has CSV, XML, and XSL-FO (PDF) output options see the List Form View/Export Example section.

**Examples:**

Example 1 (unknown):
```unknown
org.moqui.impl.entity.EntityDataLoaderImpl.EntityCsvHandler
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Logic+and+Services/Service+Jobs

**Contents:**
      - Wiki Spaces
      - Page Tree
- Service Jobs

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

Moqui provide support to configure ad-hoc (explicitly executed) or schedule jobs using moqui.service.job.ServiceJob and moqui.service.job.ServiceJobParameter entities. ServiceCallJob interface is used for ad-hoc (explicit) run of configured service jobs. User can track execution of Jobs using moqui.service.job.ServiceJobRun records.

Some important fields of moqui.service.job.ServiceJob entity that you should know-

moqui.service.job.ServiceJobParameter entity stores parameter name, value pair that passes to service on Service Job run.

Methods of ServiceCallJob interface

ImportEntityDataSnapshot job is used to import the Entity Data snapshots. Here job(String jobName) method is used to get a service caller to call a service job. There must be a moqui.service.job.ServiceJob record for this jobName.

The list of Service Jobs available at System => Server Admin => Service Jobs screen.

Some examples of a schedule job from MoquiInstallData.xml file, which is in place by default in Moqui-

**Examples:**

Example 1 (unknown):
```unknown
moqui.service.job.ServiceJob
```

Example 2 (unknown):
```unknown
moqui.service.job.ServiceJobParameter
```

Example 3 (unknown):
```unknown
moqui.service.job.ServiceJobRun
```

Example 4 (unknown):
```unknown
moqui.service.job.ServiceJobUser
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Data+and+Resources/Data+Model+Patterns

**Contents:**
      - Wiki Spaces
      - Page Tree
- Data Model Patterns
- Master Entities
- Detail Entities
- Join Entities
  - Query Patterns
- Dependent Entities
- Enumerations
- Status, Flow, Transition and History

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

There are various useful data model patterns that Moqui Framework has conventions and functionality to help support. These data model patterns are also used extensively in the Moqui and Mantle data models.

A Master Entity is one whose records exist independent of other entities, and generally has a single field primary key. Examples of this include the moqui.example.Example, moqui.security.UserAccount, mantle.party.Party, mantle.product.Product, and mantle.order.OrderHeader entities.

To set a primary sequenced ID, which is the sequenced value for the primary key of a master entity, use the EntityValue.setSequencedIdPrimary() method. You can also manually set the primary key field to any value, as long as it is unique.

A Detail Entity adds detail to a Master Entity for fields that have a one-to-many relationship with the Master. The primary key is usually two fields and one of the fields is the single primary key field of the master entity. The second field is a special sort of sequenced ID that instead of having an absolute sequence value its value is in the context of the master entity’s primary key.

An example of a detail entity is ExampleItem, which is a detail to the master entity Example. ExampleItem has two primary keys: exampleId (the primary key field of the master entity) and exampleItemSeqId which is a sub-sequence to distinguish the detail records within the context of a master record.

To populate the secondary sequenced ID first set the master’s primary key (exampleId for ExampleItem), then use the EntityValue.setSequencedIdSecondary() method to automatically populate it (for ExampleItem the exampleItemSeqId).

A single master entity can have multiple detail entities associated with it to structure distinct data as needed.

A Join Entity is used to associate Master Entities, usually two. A Join Entity is a physical representation of a many-to-many relationship between entities in a logical model.

A join entity is useful for tracking associated records among the master entities, and for any data that is associated with both master entities as opposed to just one of them. For example if you want to specify a sequence number for one master entity record in the context of a record of the other master entity, the sequence number field should go on the join entity and not on either of the master entities.

The join entity may have a single generated primary key, or a natural composite primary key consisting of the single primary key field of each of the master entities. If a relationship between two entities varies over time use the Effective Date pattern on the join entity with a fromDate field with a corresponding thruDate field that is not part of the join entity’s primary key.

One example of this is the ExampleFeatureAppl entity which joins the Example and ExampleFeature master entities. The ExampleFeatureAppl entity has three primary key fields: exampleId (the PK of the Example entity), exampleFeatureId (the PK of the ExampleFeature entity), and a fromDate. It also has a thruDate field that is not a primary key field to accompany the fromDate PK field.

To better describe the relationship between an Example and an ExampleFeature, the ExampleFeatureAppl entity also has a sequenceNum field for ordering features within and example, and a exampleFeatureApplEnumId field to describe how the feature applies to the example (Required, Desired, or Not Allowed).

To see the actual entity definition and seed data for the ExampleFeatureAppl entity see the ExampleEntities.xml file (in the example component).

Querying a join entity usually involves starting with one of the master entities and finding the related master entities using records for the join entity by specifying the ID of the known master entity and finding the ID(s) of related master entities.

If the Effective Date pattern is used (with fromDate and thruDate fields) then it should always be filtered by an anchor timestamp, which generally defaults to the current date/time. The general pattern for filtering is:

In some cases the configuration and logic calls for a single join record to honor. An example of this is that multiple price records may be configured for a product but only one is valid at any point in time. The standard query pattern for this is to use the applicable join entity record with the most recent fromDate after applying all filters (including Effective Date conditions above). In the price example this allows for a long term price with a fromDate far in the past and no thruDate along with a temporary override that has a more recent fromDate along with a thruDate when the temporary price is no longer active. To get this effect in a query simple apply the Effective Date conditions above and order the results by fromDate descending (-fromDate).

A few parts of the API and Tools app support the concept of "dependent" entities. Dependent entities can be found for any entity, but the concept is most useful for dependents of Master Entities. The general idea is that things like the items of an order (mantle.order.OrderItem) are dependent on the header (mantle.order.OrderHeader). It is useful to do operations such as data export including the master entity and all of its dependents.

Conceptually this is pretty simple, but the implementation is more complex because the information we have to work with for this is the entity relationships. The general idea is that each type one relationship points from a dependent entity to its master, and by this definition many dependent entities have more than one master entity and an entity can be both a dependent and a master entity so what an entity is depends on how you are treating it. When defining entities there is an automatic reverse type relationship for each type one relationship, and while it is generally a type many reverse relationship if the two entities have the same PK field(s) then it is a type one automatic reverse relationship.

For example, OrderItem has a type one relationship to OrderHeader so there is an automatic reverse relationship of type many from OrderHeader to OrderItem. This establishes OrderItem as a dependent of OrderHeader.

When getting dependents for an entity the method (which is part of the internal Entity Facade implementation: EntityDefinition.getDependentsTree()) runs recursively to get the dependents of dependents as well. The general idea is that for entities like OrderHeader you can get all records that define the order.

An Enumeration is simply a pre-configured set of possible values. Enumerations are used to describe single records or relationships between records. An entity may have multiple fields enumerated values.

The entity in Moqui where all enumerations are stored is named Enumeration, and values in it are split by type with a record in the EnumerationType entity.

When a field is to have a constrained set of possible enumerated values it should have the suffix "EnumId", like the exampleTypeEnumId field on the Example entity. For each field there should also be a relationship element to describe the relationship from the current entity to the Enumeration entity. The title attribute on the relationship element should have the same value as the enumTypeId that is used for the* Enumeration* records that are possible values for that field. Generally the title attribute should be the same as the enum field’s name up to the "EnumId" suffix. For example the relationship title for the exampleTypeEnumId field is ExampleType.

Another useful data concept is tracking the status of a record. Various business concepts have a lifecycle of some sort that is easily tracked with a set of possible status values. The possible status values are tracked using the StatusItem entity and exist in sets distinguished by a statusTypeId pointing to a record in the StatusType entity.

A set of status values are kind of like nodes in a graph and the transitions between those nodes represent possible changes from one status to another. The possible transitions from one status to another are configured using records in the StatusFlowTransition entity.

There can be multiple status flows for a set of status items with a given statusTypeId, each represented by a StatusFlow record. The StatusItem records are associated with a StatusFlow using StatusFlowItem records. For example the WorkEffort entity has a statusFlowId field to specify which status flow should be used for a project or task.

If an entity has only a single status associated with it the field to track the status can simply be named statusId. If an entity needs to have multiple status values then the field name should have a distinguishing prefix and end with "StatusId".

There should be a relationship defined for each status field to tie the current entity to the StatusItem entity. Similar to the pattern with the Enumeration entity, the title attribute on the relationship element should match the statusTypeId on each StatusItem record.

The audit log feature of the Entity Facade is the easiest way to keep a history of status changes including who made the change, when it was made, and the old and new status values. To turn this on just use set the enable-audit-log attribute to true on the entity.field element. With this the field definition would look something like:

A unit of measure is a standardized or custom unit for measures such as length, weight, temperature, data size, and even currency. These are the types of UOM. A moqui.basic.Uom record, identified by uomId, has type (uomTypeEnumId), description, and abbreviation fields. The OOTB data for units of measure is in the UnitData.xml file.

Most UOM types have a conversion between different units of the same type. These conversions are modeled in the UomConversion entity. For example there are 1000 meters in a kilometer, and that is recorded this way:

The conversionFactor is multiplied by the value with the uomId unit to get a value in the toUomId unit. You can also divide to go in the other direction. For example 1km = 1000m so a 1 value with the LEN_km unit is multiplied by the conversionFactor of 1000 to get a value of 1000 for the LEN_m unit.

There is also a conversionOffset field for cases such as Celsius and Fahrenheit temperatures where a value must be added (or subtracted) to go from one unit to the other. The conversionFactor is multiplied first, then the conversionOffset is added to the result. When converting in the reverse direction the conversionOffset is subtracted first, then the result is divided by the conversionFactor.

Some UOM types, such as currency, have conversion factors that change over time. To handle this the UomConversion entity has optional effective date (fromDate, thruDate) fields.

A geographic boundary can be a political division, business region, or any other geographic area. Each moqui.basic.Geo record, identified by a geoId, has a type (geoTypeEnumId) such as city, country, or sales region. Each Geo has a name (geoName) and may have 2 letter (geoCodeAlpha2), 3 letter (geoCodeAlpha3), and numeric (geoCodeNumeric) codes following the ISO 3166 pattern for country code (see the GeoCountryData.xml file for the country data that comes with Moqui).

The Geo entity also has a wellKnownText field for machine-readable detail about the geometry of the geographic boundary. It is meant to contain text following the ISO/IEC 13249-3:2011 specification which is supported by various databases and tools (including Java libraries). For a good introduction to WKT see:

http://en.wikipedia.org/wiki/Well-known_text

Use the GeoAssoc entity to associate Geo records. This has different types (geoAssocTypeEnumId) and can be used for regions of larger geographic boundaries (GAT_REGIONS; like cities within states, states within countries), for Geo records that are more general groups to associate them with the Geo records in the group (GAT_GROUP_MEMBER; like the lower 48 states in the USA), or other types you might define. The geoId field should point to the group or larger area, and the toGeoId to the group member or region within the area. See the GeoUsaData.xml file for examples of both.

A GeoPoint is a specific geographic point, i.e. a point on the Earth’s surface. It has latitude, longitude, and elevation fields and a elevationUomId field to specify the unit for the elevation (such as feet, which is LEN_ft). There is also a dataSourceId to specify where the data came from and an information field for general text about the point.

**Examples:**

Example 1 (unknown):
```unknown
moqui.example.Example
```

Example 2 (unknown):
```unknown
moqui.security.UserAccount
```

Example 3 (unknown):
```unknown
mantle.party.Party
```

Example 4 (unknown):
```unknown
mantle.order.OrderHeader
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Data+and+Resources/Data+Search

**Contents:**
      - Wiki Spaces
      - Page Tree
- Data Search

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

The Data Search feature in Moqui Framework is based on ElasticSearch (http://www.elasticsearch.org). This is a distributed text search tool based on Apache Lucene. ElasticSearch uses JSON documents as the artifact to search, and each named field in a JSON document is a facet for searching. The Data Document feature produces documents with 4 special fields that ElasticSearch uses, as described in the Data Document section (_index, _type, _id, and _timestamp).

There are two main touch points for Data Search: indexing and searching. The service for indexing in the framework is org.moqui.search.SearchServices.index#DataFeedDocuments. This service implements the org.moqui.EntityServices.receive#DataFeed interface and accepts all parameters from the interface but only uses the documentList parameter, which is the list of Data Documents to index with ElasticSearch.

It also has one other parameter, getOriginalDocuments, which when set to true the service will populate and return originalDocumentList, a list of the previously indexed version of any matching existing documents from ElasticSearch. The service always returns a documentVersionList parameter with a list of the version number for each document in the original list after the index is done to show how many times each document has been updated in the index.

The example in the previous section used an application-specific service to receive the push Data Feed, so here is an example of a push Data Feed configuration that uses the indexing service that is part of the framework:

You can also use the ElasticSearch API directly to index documents, either Data Documents produced by the Entity Facade or any JSON document you want to search. For more complete information see the ElasticSearch documentation. Here is an example of indexing a JSON document in nested Map form with the _index, _type, and _id entries set:

To search Data Documents use the org.moqui.search.SearchServices.search#DataDocuments service, like this:

Note that in this example the queryString, pageIndex, and pageSize parameters come from the search form and get into the context from request parameters. The parameters for this service are:

The service returns a documentList parameter, which is a List of Maps, each Map representing a Data Document. It also returns the various documentList* parameters that are part of the pagination pattern for Moqui XML list forms (*Count, *PageIndex, *PageSize, *PageMaxIndex, *PageRangeLow, and *PageRangeHigh). These are used when rendering a list form, and can be used for other purposes where useful as well.

In addition to this service you can also retrieve results directly through the ElasticSearch API. Note that there are two main steps, the search to get back the 3 identifying fields of each document, and then a multi-get to get all of the documents. In this example we get each document as a Map (the getSourceAsMap() method), and the ElasticSearch API also supports getting each as a JSON document (the getSourceAsString() method).

In addition to indexing and searching another aspect of ElasticSearch to know about is the deployment options. By default Moqui Framework has an embedded node of ElasticSearch running in the same JVM for fast, convenient access. A remote ElasticSearch server can also be used.

The easiest distributed deployment mode is to have each Moqui application server be a node in the ElasticSearch cluster, and if you have separate ES nodes with actual search data persisted on them then set the app server ES nodes to not persist any data. With that approach results may be aggregated on the app servers, but actual searches against index data will be done on the other servers in the cluster.

**Examples:**

Example 1 (unknown):
```unknown
org.moqui.search.SearchServices.index#DataFeedDocuments
```

Example 2 (unknown):
```unknown
org.moqui.EntityServices.receive#DataFeed
```

Example 3 (unknown):
```unknown
<moqui.entity.feed.DataFeed dataFeedId="PopCommerceSearch" dataFeedTypeEnumId="DTFDTP_RT_PUSH" feedName="PopCommerce Search"
feedReceiveServiceName="org.moqui.search.SearchServices.index#DataFeedDocuments"/> 

<moqui.entity.feed.DataFeedDocument dataFeedId="PopCommerceSearch" dataDocumentId="PopcProduct"/>
```

Example 4 (unknown):
```unknown
<moqui.entity.feed.DataFeed dataFeedId="PopCommerceSearch" dataFeedTypeEnumId="DTFDTP_RT_PUSH" feedName="PopCommerce Search"
feedReceiveServiceName="org.moqui.search.SearchServices.index#DataFeedDocuments"/> 

<moqui.entity.feed.DataFeedDocument dataFeedId="PopCommerceSearch" dataDocumentId="PopcProduct"/>
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Data+and+Resources/Data+Model+Definition

**Contents:**
      - Wiki Spaces
      - Page Tree
- Data Model Definition
- Entity Definition XML
- Entity Extension - XML

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

Let’s start with a simple entity definition that shows the most common elements. This is an actual entity that is part of Moqui Framework:

Just like a Java class an entity has a package name and the full name of the entity is the package name plus the entity name, in the format:

${package}.${entity-name}

Based on that pattern the full name of this entity is:

moqui.basic.DataSource

This example also has the entity.cache attribute set to true, meaning that it will be cached unless the code doing the find says otherwise.

The first field (dataSourceId) has the is-pk attribute set to true, meaning it is one of the primary key fields on this entity. In this case it is the only primary key field, but any number of fields can have this attribute set to true to make them part of the primary key.

The third field (description) is a simple field to hold data. It is not part of the primary key, and it is not a foreign key to another entity.

The field.type attribute is used to specify the data type for the field. The default options are defined in the MoquiDefaultConf.xml file with the database-list.dictionary-type element. These elements specify the default type settings for each dictionary type and there can be an override to this setting for each database using the database.database-type element.

You can use these elements to add your own types in the data type dictionary. Those custom types won’t appear in autocomplete for the field.type attribute in your XML editor unless you change the XSD file to add them there as well, but they will still function just fine.

The second field (dataSourceTypeEnumId) is a foreign key to the Enumeration entity, as denoted by the relationship element in this entity definition. The two records in under the seed-data element define the EnumerationType to group the Enumeration options, and one of the Enumeration options for the dataSourceTypeEnumId field. The records under the seed-data element are loaded with the command-line -load option (or the corresponding API call) along with the seed type.

There is an important pattern here that allows the framework to know which enumTypeId to use to filter Enumeration options for a field in automatically generated form fields and such. Notice that the value in the relationship.title attribute matches the enumTypeId. In other words, for enumerations anyway, there is a convention that the relationship.title value is the type ID to use to filter the list.

This is a pattern used a lot in Moqui and in the Mantle Business Artifacts because the Enumeration entity is used to manage types available for many different entities.

In this example there is a key-map element under the relationship element, but that is only necessary if the field name(s) on this entity does not match the corresponding field name(s) on the related entity. In other words, because the foreign key field is called dataSourceTypeEnumId instead of simply enumId we need to tell the framework which field to use. It knows which field is the primary key of the related entity (Enumeration in this case), but unless the field names match it does not know which fields on this entity correspond to those fields.

In most cases you can use something more simple without key-map elements like:

The seed-data element allows you to define basic data that is necessary for the use of the entity and that is an aspect of defining the data model. These records get loaded into the database along with the entity-facade-xml files where the type attribute is set to seed.

With this introduction to the most common elements of an entity definition, lets now look at some of the other elements and attributes available in an entity definition.

While some database optimizations must be done in the database itself because so many such features vary between databases, you can declare indexes along with the entity definition using the index element. As an element under the entity element it would look something like this:

An entity can be extended without modifying the XML file where the original is defined. This is especially useful when you want to extend an entity that is part of a different component such as the Mantle Universal Data Model (mantle-udm) or even part of the Moqui Framework and you want to keep your extensions separate.

This is done with the extend-entity element which can mixed in with the entity elements in an entity definition XML file. This element has most of the same attributes and sub-elements as the entity element used to define the original entity. Simply make sure the entity-name and package match the same attributes on the original entity element and anything else you specify will add to or override the original entity.

Here is an example if a XML snippet to extend the moqui.example.Example entity:

**Examples:**

Example 1 (unknown):
```unknown
<entity entity-name="DataSource" package="moqui.basic" cache="true">
     <field name="dataSourceId" type="id" is-pk="true"/>
     <field name="dataSourceTypeEnumId" type="id"/>
     <field name="description" type="text-medium"/>
     <relationship type="one" title="DataSourceType" related="Enumeration">
        <key-map field-name="dataSourceTypeEnumId"/>
     </relationship>
     <seed-data>
         <moqui.basic.EnumerationType description="Data Source Type" enumTypeId="DataSourceType"/>
         <moqui.basic.Enumeration description="Purchased Data" enumId="DST_PURCHASED_DATA" enumTypeId="DataSourceType"/>;
     </seed-data>
</entity>
```

Example 2 (unknown):
```unknown
<entity entity-name="DataSource" package="moqui.basic" cache="true">
     <field name="dataSourceId" type="id" is-pk="true"/>
     <field name="dataSourceTypeEnumId" type="id"/>
     <field name="description" type="text-medium"/>
     <relationship type="one" title="DataSourceType" related="Enumeration">
        <key-map field-name="dataSourceTypeEnumId"/>
     </relationship>
     <seed-data>
         <moqui.basic.EnumerationType description="Data Source Type" enumTypeId="DataSourceType"/>
         <moqui.basic.Enumeration description="Purchased Data" enumId="DST_PURCHASED_DATA" enumTypeId="DataSourceType"/>;
     </seed-data>
</entity>
```

Example 3 (unknown):
```unknown
moqui.basic.DataSource
```

Example 4 (unknown):
```unknown
database-list.dictionary-type
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Source+Management

**Contents:**
      - Wiki Spaces
      - Page Tree
- Source Management Guide
- Moqui Ecosystem Repositories
- Gradle Tasks for Source Management
- Add On Component Repositories and myaddons.xml
- Forking Moqui Repositories
- Command Line Examples
  - Fresh Local Setup
  - Configure Upstream for Forked Repository

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

Moqui Ecosystem is made up of dozens of repositories so you can choose the tools, business artifacts, applications, and integrations you need while not worrying about the rest. All repositories represent a component that goes in the runtime/component directory with the exception of the framework (moqui-framework) and the default runtime directory (moqui-runtime).

Moqui Framework and all other core Moqui Ecosystem repositories are hosted on GitHub. These repositories are all configured in the addons.xml file (in the root of moqui-framework repository) to make it easy to do git operations such as get/clone, pull, and status for all repositories including all components of your own you might add.

The same structure of one git repository per component is recommended for your own components as well.

Because each component is in its own git repository your local working directory will typically have a dozen or more git repositories to keep track of. To simplify working with multiple git repositories there are various Gradle tasks in the root build.gradle file in moqui-framework.

Note that Gradle matches task names by partial strings as long as they match a single task so the table below includes the full task name plus some recommended shortcuts.

To see a list of all available Gradle tasks: gradle tasks --all

Most of the Moqui tasks have descriptions with usage information including required properties. Passing properties to a Gradle task is somewhat cumbersome, done with -P<name>=<value> parameters.

The settings.gradle file in moqui-framework has a script to find all components with a build.gradle file and automatically adds them to the top level module. Because of this all common tasks such as build, test, etc will run on components automatically.

In general when working with Moqui you should keep all of your code and other artifacts in one or more add on components with a git repository for each.

Each component should declare other components it depends on using a component.xml file. This is used by the Gradle getComponent task to automatically get other needed components and it is used to make sure all dependent components are in place when Moqui starts up. Here is an example component.xml file with some dependencies:

The component name should match the directory name it lives in, which is the name of the git repository.

To tell the Gradle tasks about your component add them in a myaddons.xml file located in the moqui root directory, alongside addons.xml. This is preferred to modifying addons.xml so that your components and source repository locations and such are kept separate from the stock Moqui components and repositories.

The myaddons.xml file has the same structure as addons.xml and can be used to both add and override settings there. For example you can specify alternate repositories and components to point to your forks of any Moqui repository such as mantle-usl and SimpleScreens.

Here is a very simple example to add a single custom component:

This uses the github-ssh repository defined in addons.xml so that it is downloaded via SSH instead of by HTTPS. This is convenient when working with private repositories to avoid authentication issues. The Gradle tasks use a Git client written in Java which will generally pick up your SSH keys in the ~/.ssh directory (for Mac and Linux).

Here is an example of a more complex myaddons.xml file that overrides the location of the runtime directory and a number of stock Moqui components, along with adding custom components:

To use SSH instead of HTTPS for all components this uses the default-repository attribute along with a repository element to specify the git location for a custom repository (standard GitHub URL in this example, same as github-ssh in the stock addons.xml file).

There are many reasons you might want to fork the stock Moqui repositories. This is necessary to create pull requests on GitHub to submit contributions. You can also use this to manage your modifications to Moqui framework, runtime, and stock components and still maintain an upstream link for periodic upstream merges.

One important best practice when using Moqui is to avoid changing the stock Moqui source code and other artifacts. This makes it easier to update and is made possible by dozens of framework features that allow you to register tools, add screens to the default webroot screen tree, trigger your own services on various business events, change look and feel, and much more.

**Examples:**

Example 1 (unknown):
```unknown
myaddons.xml
```

Example 2 (unknown):
```unknown
runtime/component
```

Example 3 (unknown):
```unknown
moqui-framework
```

Example 4 (unknown):
```unknown
moqui-runtime
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/System+Interfaces/Web+Service

**Contents:**
      - Wiki Spaces
      - Page Tree
- Web Service
- XML-RPC and JSON-RPC
- Sending and Receiving Simple JSON
- RESTful Interface

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

Moqui has tools for providing and consuming XML-RPC and JSON-RPC services. Any Service Facade service can be exposed as a remote callable service by setting the service.allow-remote attribute to true.

The Web Facade has methods to receive these RPC calls: ec.web.handleXmlRpcServiceCall() and ec.web.handleJsonRpcServiceCall(). In the OOTB webroot component there is a rpc.xml screen that has xml and json transitions that call these methods. With the setup the URL paths for the remote service calls are /rpc/xml and /rpc/json.

Below is an example of a JSON-RPC service call, using curl as the client. It calls the org.moqui.example.ExampleServices.createExample service with name, type, and status parameters. It also passes in the username and password to use for authentication before running the service (following a pattern that can be used for any Service Facade service call).

The id field is always something like 1. This JSON-RPC field is used for multi-message requests Each message in the request would have a different id value and that value is used in the id field in the response. To use this the JSON string would have an outer list containing the individual messages like the one in this example.

http://localhost:8080/rpc/json

When you run this you will get a response like (the exampleId value will vary):

The JSON-RPC implementation in Moqui follows the JSON-RPC 2.0 specification available at: http://www.jsonrpc.org/specification.

XML-RPC requests follow a similar pattern. Moqui uses Apache XML-RPC library (http://ws.apache.org/xmlrpc/) which implements the XML-RPC specification available at: http://xmlrpc.scripting.com/spec.html.

While you can write code call remote XML-RPC and JSON-RPC services by directly using a library (or custom JSON handling code like in RemoteJsonRpcServiceRunner.groovy), the easiest way to call remote services is to use a proxy service definition. To do this:

When you call this service locally the Service Facade will call the remote service and return the results. In other words, you call a local service that is a configured proxy to the remote service.

Sometimes an API spec calls for a particular JSON structure or something other than the envelope structure of JSON-RPC. There are some feature in the Web Facade that make this easier.

When a HTTP request is received (really when the Web Facade is initialized) if the Content-Type (MIME type) of the request is application/json it will parse the JSON string in the request body and if the outer element is a Map (in JSON an object) then the entries in that Map will be added to the web parameters (ec.web.parameters), and web parameters are automatically added to the context (ec.context) with a screen is rendered or a screen transition run. If the outer element is a List (in JSON an array) then it is put in a _requestBodyJsonList web parameter, and again from there available in the context.

This makes it easy to get at the JSON data in a web request. It also resolves issues with getting the request body after the Web Facade automatically looks for multi-part content in the request body (which the Web Facade always does) because the Servlet container may not allow reading the request body again after this.

For a JSON response you can manually put together the response by setting various things on the HttpServletResponse and using the Groovy JsonBuilder to produce the JSON text. For convenience the ec.web.sendJsonResponse(Object responseObj) method does all of this for you.

To go in the other direction, doing a request to a URL that accepts and responds with JSON, there are special tools because the Groovy and other utilities make this pretty simple. For example, this a variation on the actual code that remotely calls a JSON-RPC service:

Map jsonRequestMap = [ jsonrpc:"2.0", id:1, method:method, params:parameters ]

JsonBuilder jb = new JsonBuilder()

jb.call(jsonRequestMap)

String jsonResponse = StupidWebUtilities.simpleHttpStringRequest(location,

jb.toString(), "application/json")

Object jsonObj = new JsonSlurper().parseText(jsonResponse)

This uses the JsonBuilder and JsonSlurper classes from Groovy and the StupidWebUtilities.simpleHttpStringRequest() method which internally uses the Apache HTTP Client library.

A RESTful service uses a URL pattern and request method to identify a service instead of a method name like JSON-RPC and XML-RPC. The general idea is to have things like a record represented by URL with the type of record (like an entity or table) as a path element and the ID of the record as one or more path elements (often one for simplicity, i.e., a single field primary key).

When interacting with this record as a web resource the HTTP request method specifies what to do with the record. This is much like the create, update, and delete service verbs for Moqui entity-auto services. The GET method generally does a record lookup. The POST method generally maps to creating a record. The PUT method generally maps to updating a record. The DELETE method does the obvious, a delete.

For examples, such as the one below, see the ExampleApp.xml file.

To support RESTful web services we need a way for transitions to be sensitive to the HTTP request method when running in a web-based application. This is handled in Moqui Framework using the transition.method attribute, like this:

To test this transition use a curl command something like this to update the exampleName field of the Example entity with an exampleId of 100010:

http://.../apps/example/ExampleEntity/100010

There are some important things to note about this example that make it easier to create REST wrappers around internal Moqui services:

There are various other examples of handling RESTful service requests in the ExampleApp.xml file.

**Examples:**

Example 1 (unknown):
```unknown
curl -X POST -H "Content-Type:application/json"
 --data{  
  "jsonrpc":"2.0",
  "method":"org.moqui.example.ExampleServices.createExample",
  "id":1,
  "params":{  
    "authUsername":"john.doe",
    "authPassword":"moqui",
    "exampleName":"JSON-RPC Test 1",
    "exampleTypeEnumId":"EXT_MADE_UP",
    "statusId":"EXST_IN_DESIGN"
  }
```

Example 2 (unknown):
```unknown
curl -X POST -H "Content-Type:application/json"
 --data{  
  "jsonrpc":"2.0",
  "method":"org.moqui.example.ExampleServices.createExample",
  "id":1,
  "params":{  
    "authUsername":"john.doe",
    "authPassword":"moqui",
    "exampleName":"JSON-RPC Test 1",
    "exampleTypeEnumId":"EXT_MADE_UP",
    "statusId":"EXST_IN_DESIGN"
  }
```

Example 3 (unknown):
```unknown
{  
  "jsonrpc":"2.0",
  "id":1,
  "result":{  
    "exampleId":"100050"
  }
}
```

Example 4 (unknown):
```unknown
{  
  "jsonrpc":"2.0",
  "id":1,
  "result":{  
    "exampleId":"100050"
  }
}
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/docs/framework/Security

**Contents:**
      - Wiki Spaces
      - Page Tree
- Security
- Authentication
- Simple Permissions
- Artifact-Aware Authorization
  - Artifact Execution Stack and History
  - Artifact Authz
  - Entity Filter Sets and Authorization
- Artifact Tarpit

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

The main code path for user authentication starts with a call to the UserFacade.loginUser() method. This calls into Apache Shiro for the actual authentication. This is basically what the code looks like to authenticate using the Shiro SecurityManager that the ExecutionContextFactoryImpl keeps internally:

Shiro is configured by default to use the MoquiShiroRealm so this ends up in a call to the MoquiShiroRealm.getAuthenticationInfo() method, which authenticates using the moqui.security.UserAccount entity and handles things like disabled accounts, keeping track of failed login attempts, etc. Here are the lines from the shiro.ini file where this is configured:

Shiro can be configured to use other authentication realms such as the CasRealm, JdbcRealm, or JndiLdapRealm classes that come with Shiro. You can also implement your own, or even modify the MoquiShiroRealm class to better suit your needs. Shiro has documentation for writing your own realm, and each of these classes has documentation on configuration, such as this JavaDoc for JndiLdapRealm to use it with an LDAP server:

http://shiro.apache.org/static/1.4.0/apidocs/org/apache/shiro/realm/ldap/JndiLdapRealm.html

Back to the MoquiShiroRealm that is used by default, here is its default configuration from the MoquiDefaultConf.xml file that can be overridden in your runtime Moqui Conf XML file:

The login element configures the max number of login failures to allow before disabling a UserAccount (max-failures), how long to disable the account when the max failures is reached (disable-minutes), whether to store a history of login attempts in the UserLoginHistory entity (history-store) and whether to persist incorrect passwords in the history (history-incorrect-password).

The login-key element is used to configure login/api key. encrypt-hash-type tells which hash algorithm to use and expire-hours tells how long it takes to expire.

The password element is used to configure the password constraints that are checked when creating an account (org.moqui.impl.UserServices.create#UserAccount) or updating a password (org.moqui.impl.UserServices.update#Password).

Settings include the hash algorithm to use for passwords before persisting them and before comparing an entered password (encrypt-hash-type; MD5, SHA, SHA-256, SHA-384, SHA512), the minimum password length (min-length), the minimum number of digit characters in the password (min-digits), the minimum number of characters other than digits or letters (min-others), how many old passwords to remember on password change to avoid use of the same password (history-limit), and how many weeks before forcing a password change (change-weeks).

The main way to reset a forgotten password is by an email that includes a randomly generated password. The email-require-change attribute specifies whether to require a change on the first login with the password from the email, making it a temporary password. The email-expire-hours attribute specifies how many hours before the password in the email expires.

The most basic for of authorization (authz) is a permission explicitly checked by code. Artifact-aware authz (covered in the next section) is generally more flexible as it is configured external to the artifact (screen, service, etc) and is inheritable to avoid issues when artifacts (especially services) are reused.

The API method to check permissions is the ec.user.hasPermission(String userPermissionId) method. A user has a permission if the user is a member (UserGroupMember) of a group (UserGroup) that has the permission (UserGroupPermission). The userPermissionId may point to a UserPermission record, but it may also be any arbitrary text value as the UserGroupPermission has no foreign key to UserPermission.

The artifact-aware authorization in Moqui enables external configuration of access to artifacts such as screens, screen transitions, services, and even entities. With this approach there is no need to add code or configuration to each artifact to check permissions or otherwise see if the current user has access to the artifact.

The ArtifactExecutionFacade is used by all parts of the framework to keep track of each artifact as it executes. It keeps a stack of the currently executing artifacts, each one pushed on the stack as it begins (with one of the push() methods) and popped from the stack as it ends (with the pop() method). As each artifact is pushed on to the stack it is also added to a history of all artifacts used in the current ExecutionContext (i.e., for a single web request, remote service call, etc).

Use the ArtifactExecutionInfo peek() method to get info about the artifact at the top of the stack, Deque<ArtifactExecutionInfo> getStack() to get the entire current stack, and List<ArtifactExecutionInfo> getHistory() to get a history of all artifacts executed.

This is important for artifact-aware authorization because authz records are inheritable. If an artifact authz is configured inheritable then not only is that artifact authorized but any artifact it uses is also authorized.

Imagine a system with hundreds of screens and transitions, thousands of services, and hundreds of entities. Configuring authorization for every one of them would require a massive effort to both setup initially and to maintain over time. It would also be very prone to error, both incorrectly allowing and denying access to artifacts and resulting in exposure of sensitive data or functionality, or runtime errors for users trying to perform critical operations that are a valid part of their job.

The solution is inheritable authorization. With this you can setup access to an entire application or part of an application with authz configuration for a single screen that all sub-screens, transitions, services, and entities will inherit. To limit the scope sensitive services and entities can have a deny authz that overrides the inheritable authz, requiring special authorization to those artifacts. With this approach you have a combination of flexibility, simplicity, and granular control of sensitive resources.

This is also used to track performance metrics for each artifact. See the Artifact Execution Runtime Profiling section for details.

The first step to configure artifact authorization is to create a group of artifacts. This involves a ArtifactGroup record and a ArtifactGroupMember record for each artifact, or artifact name pattern, in the group.

For example here is the artifact group for the Example app with the root screen (ExampleApp.xml) as a member of the group:

In this case the artifactName attribute has the literal value for the location of the screen. It can also be a pattern for the artifact name (with nameIsPattern="Y"), which is especially useful for authz for all services or entities in a package. Here is an example of that for all services in the org.moqui.example package, or more specifically all services whose full name matches the regular expression "org.moqui.example..*":

The next step is to configure authorization for the artifact group with a ArtifactAuthz record. Below is an example of a record that gives the ADMIN group always (AUTHZT_ALWAYS) access for all actions (AUTHZA_ALL) to the artifacts in the EXAMPLE_APP artifact group setup above.

The always type (authzTypeEnumId) of authorization overrides deny (AUTHZT_DENY) authorizations, unlike the allow authz (AUTHZT_ALLOW) which is overridden by deny. The other options for the authz action (authzActionEnumId) include view (AUTHZA_VIEW), create (AUTHZA_CREATE), update (AUTHZA_UPDATE), and delete (AUTHZA_DELETE) in addition to all (AUTHZA_ALL).

For example here is a record that grants only view authz with the type allow (so can be denied) of the same artifact group to the EXAMPLE_VIEWER group:

Entity artifact authorization can also be restricted to particular records using the ArtifactAuthzRecord entity. This is used with a view entity (viewEntityName) that joins between the userId of the currently logged in user and the desired record. If the name of the field with the userId is anything other than userId specify its name with the userIdField field. The record level authz is checked by doing a query on the view entity with the current userId and the PK fields of the entity the operation is being done on. To add constraints to this query you can add them to the view-entity definition, use the filterByDate attribute, or use ArtifactAuthzRecordCond records to specify conditions.

If authorization fails when an artifact is used the framework creates a ArtifactAuthzFailure record with relevant details.

Automatic query augmentation (adding conditions to find/select queries) can be used to filter records by configuration using the ArtifactAuthzFilter entity. This tries record level authorization to application (screen/etc) authorization. Each filter set associated with an ArtifactAuthz has various condition expressions stored using the EntityFilterSet entity.

Each record has an Entity Name for the entity that should be filtered when queried on (either directly or through a view-entity, ie joined into a query). Each record also has a Filter Map which is a Groovy expression that should evaluate to a Map. While filtering can be done on view entities it is not a good practice as data leakage is easy through direct entity finds or other view entities so filters are generally defined only on plain entities and not view entities.

For view entities and dynamic view entities, which includes DataDocument based dynamic view entities, in order for a filter to apply to a query the fields used in each filter must be included in the definition. This means that entities with a filter must also be included in the view. For example any view entity or report on OrderItem should also include the customerPartyId and vendorPartyId fields on the OrderPart entity for active or user organization based filtering.

The Groovy expressions can be somewhat complex to interpret so below is a list of the entities with a filter and the fields and logic involved. The main OOTB example in Moqui is in the Mantle USL component for organization based record filtering. The expressions use two variables that are always available (populated in always-actions in the root screen of any application that should support organization based filters): ‘activeOrgId’ for the ID of the user selected active organization and ‘filterOrgIds’ which is a set of IDs that should be used to filter the results, either just the activeOrgId or if no active org then all partyIds of organizations the current user is a member of.

An artifact tarpit limits the velocity of access to artifacts in a group. Here is an example of an artifact group for all screens and a ArtifactTarpit to restrict access for all users to each screen for 60 seconds (tarpitDuration) if there are more than 120 hits (maxHitsCount) within 60 seconds (maxHitsDuration).

When a particular user (userId) exceeds the configured velocity limit for a particular artifact (artifactName) or a particular type (artifactTypeEnumId) the framework creates a ArtifactTarpitLock record to restrict access to that artifact by the user until a certain date/time (releaseDateTime).

**Examples:**

Example 1 (unknown):
```unknown
UsernamePasswordToken token = new UsernamePasswordToken(username, password)
Subject loginSubject = eci.getEcfi().getSecurityManager() .createSubject(new DefaultSubjectContext())
loginSubject.login(token)
```

Example 2 (unknown):
```unknown
UsernamePasswordToken token = new UsernamePasswordToken(username, password)
Subject loginSubject = eci.getEcfi().getSecurityManager() .createSubject(new DefaultSubjectContext())
loginSubject.login(token)
```

Example 3 (unknown):
```unknown
moquiRealm = org.moqui.impl.util.MoquiShiroRealm
securityManager.realms = $moquiRealm
```

Example 4 (unknown):
```unknown
moquiRealm = org.moqui.impl.util.MoquiShiroRealm
securityManager.realms = $moquiRealm
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework

**Contents:**
      - Wiki Spaces
      - Page Tree
- Moqui Framework

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

This space contains documentation about Moqui Framework. It is more technical in nature, meant for developers and IT staff.

If you're just getting started with Moqui the recommended reading order for these documents is:

Before you begin a larger project or do more significant development these documents will be helpful:

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Run+and+Deploy

**Contents:**
      - Wiki Spaces
      - Page Tree
- Running and Deployment Instructions
- 1. Quick Start
  - Required Software: Java JDK 11 and ElasticSearch
  - Moqui Binary Release Quick Start
  - From Source Quick Start with ElasticSearch
  - From Source Quick Start with Docker Compose
  - Really Quick Start
- 2. Runtime Directory and Moqui Configuration XML File

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

This document explains how to run Moqui through the executable war file, or by deploying a war file in an application server.

The only required software for the default configuration of Moqui Framework is the Java SE JDK version 11 or later. ElasticSearch or OpenSearch are also required for certain functionality in the service library (mantle-usl) and applications including POPC ERP, HiveMind, and Marble ERP.

On Linux OpenJDK is generally the best option. For Debian based distributions the apt package is openjdk-11-jdk. For Fedora/CentOS/Redhat distributions the yum package is java-11-openjdk-devel.

On macOS and Windows there are OpenJDK distributions available for download from Azul Systems, including a distribution for the Apple ARM architecture:

https://www.azul.com/downloads/?package=jdk#download-openjdk

The Oracle Java SE downloads are another good option:

http://www.oracle.com/technetwork/java/javase/downloads

Moqui Framework also includes an ElasticSearch client for ElasticSearch 7.0 or later. The recommended version to use is the OSS (Apache 2.0 licensed) build with no JDK included. If this is available on localhost port 9200 the default configuration in Moqui will find it, otherwise see configuration environment variables and such below for more options.

https://www.elastic.co/downloads/elasticsearch-oss-no-jdk

NOTE: Before the java11 branch in the moqui-framework repository was merged on 25 April 2022 Moqui required Java 8 or later. For more information see pull request 527.

Use the following steps to do a local install from source and run with the default embedded database (H2) and ElasticSearch installed in the runtime/elasticsearch directory.

Use the following steps to do a local install from source and run with a database and ElasticSearch in Docker containers separate from Moqui. This works best on Linux but can be used with some variations on MacOS and Windows.

Moqui Framework has two main parts to deploy:

However you use the executable WAR file, you must have a runtime directory and you may override default settings with a XML configuration file.

All configuration for Moqui Framework lives in the Moqui Conf XML file. The actual configuration XML file used at runtime is built by merging various XML files in this order:

The runtime directory is the main place to put components you want to load, the root files (root screen, etc) for the web application, and configuration files. It is also where the framework will put log files, H2 database files (if you are using H2), JCR repo files, etc. You may eventually want to create your own runtime directory and keep it in your own source repository (fork the moqui-runtime repository) but you can use the default one to get started and for most deployments with add-on applications everything in moqui-runtime you will commonly want to override or extend can be done within your add-on components.

Specify these two properties:

There are two ways to specify these two properties:

See below for examples.

Yep, that's right: an executable WAR file.

If the first argument is load it will load data. If the first argument is help it will show the help text. If there are no arguments or the first argument is anything else it will run the embedded web server (the Jetty Servlet Container). The MoquiStart class can also be run directly if the WAR file has been unzipped into a directory.

If no types or location argument is used all found data files of all types will be loaded.

The easiest way to run is to have a moqui directory with the moqui.war file and the runtime directory in it. With the binary distribution of Moqui when you unzip the archive this is what you'll have.

To use the default settings:

The best way to manage source repositories for components is to have one repository (on GitHub or elsewhere) per component that contains only the component directory.

Following this pattern the Gradle build scripts in Moqui have tasks to download components and their dependencies from a git repository, or from current or release archives.

Known open source components are already configured in the addons.xml file. To add private and other components or override settings for components in the addons.xml file, create a file called myaddons.xml and put it in the moqui directory.

Here is a summary of the Gradle tasks for component management (using the HiveMind component for example). All of the get tasks get the specified component plus all components it depends on (as specified in its component.xml file).

There are also Gradle tasks to help you manage your components from git. Each of these commands does git operations if a .git directory exists for the moqui (root) repository, the runtime repository, and all components.

Moqui Framework uses Gradle for building from source. There are various custom tasks to automate frequent things, but most work is done with the built-in tasks from Gradle. There is also an Ant build file for a few common tasks, but not for building from source.

The examples above use the Gradle Wrapper (gradlew) included with Moqui. You can also install Gradle (2.0 or later) The load and run tasks depend on the build task, so the easiest to get a new development system running with a populated database is:

This will build the war file, run the data loader, then run the server. To stop it just press <ctrl-c> (or your preferred alternative).

In production it is more common to have an external ElasticSearch cluster running separate from the Moqui server or cluster. This can also be used for local development where you start, stop, clear data, etc separate from Moqui or the Moqui Gradle tasks. This will work with any variation of ElasticSearch version 7.0.0 or later (OSS or not, with or without JDK, hosted by Elastic or AWS, etc). If you are installing ElasticSearch the recommended variation is the OSS with no JDK:

https://www.elastic.co/downloads/elasticsearch-oss-no-jdk

The configuration for ElasticSearch clusters is in the Moqui Conf XML file with a 'default' cluster in the MoquiDefaultConf.xml file that uses environment variables (or Java system properties) for easier configuration. See the section below for ElasticSearch and other environment variables available. Unless you are using an ElasticSearch install that requires HTTP Basic Authentication the only env var (property) you need to configure is elasticsearch_url which defaults to http://localhost:9200.

ElasticSearch may be installed in the runtime/elasticsearch directory and run by Moqui when it starts (through MoquiStart only) as well as started, stopped, and data cleaned through various Gradle tasks. In local development environments it is more common to run a local instance of ElasticSearch and clear the data in it along with the H2 database data. This can also be used for production environments where you do not need or want a separate ElasticSearch cluster.

Note that the current support for ElasticSearch installed in runtime/elasticsearch in MoquiStart and Gradle tasks is limited to Unix variants only (ie Linux, MacOS) and uses the OSS no-JDK build for Linux (with no JDK it also works on MacOS). This will not currently work on Windows machines, so if you're doing development on Windows you get to install and manage ElasticSearch separately, just make sure it's available at http://localhost:9200 (or configure elasticsearch_url to point elsewhere).

Make sure that the JAVA_HOME environment variable is set so ElasticSearch knows where to find the Java JDK.

To install ElasticSearch in runtime/elasticsearch the easiest way is to use the Gradle task. This will download the OSS no-JDK Linux, Mac, or Windows build of ElasticSearch and expand the archive in runtime/elasticsearch.

$ ./gradlew downloadElasticSearch

In Gradle there are also startElasticSearch and stopElasticSearch tasks. Note that Gradle supports partial task names as long as they match a single task so you can use shorter task names like downloadel, startel, and stopel.

$ ./gradlew startel$ ./gradlew stopel

These report a message when trying to start or stop, and do nothing if they don't find an ElasticSearch install (if the runtime/elasticsearch/bin directory does not exist) or they find that ES is already running or not running (is running if the runtime/elasticsearch/pid file exists). Because of this if you aren't sure of ElasticSearch is running or not you can run startel to make sure it's running or stopel to make sure it's not running.

The cleanDb, load, loadSave, reloadSave, and test tasks all respect the runtime/elasticsearch install. If ES is running (pid file exists) cleanDb will stop ES, delete the data directory, then start ES. Note that the test task automatically starts ES if the bin directory exists (detect ES install) and the pid file does not, but it does not currently stop ES after running all tests.

The MoquiStart class will try to start ElasticSearch installed in runtime/elasticsearch if it finds a 'bin' directory there. To disable this behavior use the no-run-es argument. To use this just run Moqui with:

$ java -jar moqui.war

This also works with along with the load argument, ie:

$ java -jar moqui.war load

This will start and stop ElasticSearch along with Moqui, running it in a forked process using Runtime.exec(). Note that the MoquiStart class is used when running the executable WAR with java -jar as in the examples above, and when running from the root directory of the expanded WAR file as the Procfile does, like:

java -cp . MoquiStart port=5000 conf=conf/MoquiProductionConf.xml

The MoquiStart class is NOT used when you drop the embedded WAR file in an external Servlet Container like Tomcat or Jetty. If you deploy Moqui that way you must use an external ElasticSearch server or cluster.

For a local development instance of Moqui a common development cycle is to clean then load data, run tests, reload data from saved archives and run tests, etc. To do a full test run make sure ElasticSearch is installed in runtime/elasticsearch and preferably is not already running, then do:

$ ./gradlew loadsave test stopel

After running that to reload the data saved just after the initial data load (including H2 and ElasticSearch data) and run a specific component's tests (like mantle-usl), just run:

$ ./gradlew reloadsave startel runtime:component:mantle-usl:test stopel

After running a build, load, etc through whatever approach you prefer just start Moqui and it starts and stops ElasticSearch:

$ java -jar moqui.war

Those are examples of common things to do in local development and can vary depending on your preferred process and Gradle tasks.

Support for single database configuration was added for easier Docker, etc deployment and can be used in any environment. This is an alternative to adding database configuration in the runtime Moqui Conf XML file as described in the next section.

Each of these can be system environment variables (with underscores) or Java properties (with underscores or dots) using the -D command-line argument.

The JDBC driver for the desired database must be on the classpath. The jar file can be added to the runtime/lib directory (within the moqui-plus-runtime.war file if used) or on the command line. In Docker images the runtime/lib directory within the container can be mapped to a directory on the host for convenience (along with runtime/conf and many other directories).

Note that the 'mysql' database configuration also works with MariaDB and Percona.

Environment variables are a convenient way to configure the database when using pre-built WAR files with runtime included or Docker images.

To configure the ElasticSearch client built into Moqui Framework use the following environment variables:

Another set of common environment variables to use is for URL writing, locale, time zone, etc:

Database (or datasource) setup is done in the Moqui Conf XML file with moqui-conf.entity-facade.datasource elements. There is one element for each entity group and the datasource.@group-name attribute matches against entity.@group-name attribute in entity definitions. By default in Moqui there are 4 entity groups: transactional, nontransactional, configuration, and analytical. If you only configure a datasource for the transactional group it will also be used for the other groups.

Here is the default configuration for the H2 database:

The database-conf-name attribute points to a database configuration and matches against a database-list.database.@name attribute to identify which. Database configurations specify things like SQL types to use, SQL syntax options, and JDBC driver details.

This example uses a xa-properties element to use the XA (transaction aware) interfaces in the JDBC driver. The attribute on the element are specific to each JDBC driver. Some examples for reference are included in the MoquiDefaultConf.xml file, but for a full list of options look at the documentation for the JDBC driver.

The JDBC driver must be in the Java classpath. The easiest way get it there, regardless of deployment approach, is to put it in the runtime/lib directory.

Here is an example of a XA configuration for MySQL:

To use something like this put the datasource element under the entity-facade element in the runtime Moqui Conf XML file (like the MoquiProductionConf.xml file).

For more examples and details about recommended configuration for different databases see the comments in the MoquiDefaultConf.xml file:

https://github.com/moqui/moqui-framework/blob/master/framework/src/main/resources/MoquiDefaultConf.xml

The default Dockerfile and a script to build a Docker image based on the moqui-plus-runtime.war file are in the moqui/docker/simple directory which you can see on GitHub here:

https://github.com/moqui/moqui-framework/tree/master/docker/simple

For example after adding all components, JDBC drivers, and anything else you want in your runtime directory do something like:

On the server where the image will run make sure Docker (docker-ce) and Docker Compose (docker-compose) are installed and then pull the image created above. There are various Docker Compose examples in the moqui/docker directory:

https://github.com/moqui/moqui-framework/tree/master/docker

You'll need to create a custom compose YAML file based on one of these. This is where you put database, host, and other settings and is where you specify the image to use (like mygroup/myrepo above). To pull your image and start it up along with other Docker images for other needed applications (nginx, mysql or postgres, etc) do something like:

There is also a compose-down.sh script to bring down an instance. For updates after running docker pull you can run compose-up.sh without running compose-down.sh first and Docker Compose will simply update the containers with new images versions.

You may want to modify the compose-up.sh script and others to fit your specific deployment, including configuration and other Moqui runtime files you want to live on the Docker host instead of in a container (to survive updates, use configuration, etc). Generally when setting up a new Docker server it is recommended to create a private git repository to use as a shell for your Docker deployment. This would contain your compose up/down scripts, your compose YML file(s), and a runtime directory with any additional configuration files, components, JDBC jars, etc.

The recommended approach for deployment with AWS ElasticBeanstalk is to use a 'Java SE' environment. A Tomcat environment can be used by simply uploading a moqui-plus-runtime.war file but there are issues with this approach in that it is less flexible, Tomcat settings need to be adjusted for capacity, various changes are needed to support websocket, and so on. Using a Java SE environment with the embedded Jetty web server generally runs better and has various defaults already in place that are recommended for Moqui, plus full control of the command line to start the server to adjust servlet threads, port, Moqui XML Conf file to use, etc.

In a AWS EB Java SE environment you'll have a nginx proxy already in place that by default expects the application to be running on port 5000. The Java SE environment is used by uploading an application archive containing files for the application(s) and to tell the Java SE environment what to do. Since Moqui Framework 2.1.1 there is a Procfile included that will be added to the moqui-plus-runtime.war file. By default it contains:

Note that it does not contain memory options so that they may be set with the JAVA_TOOL_OPTIONS environment variable. For example set it to "-Xmx1024m -Xms1024m" for a 1024 MB Java heap. The heap size on a dedicated instance should be about 1/2 the total system memory (leaving room for off-heap Java memory usage and operating system memory usage).

The 'run-es' argument tells the MoquiStart class to run ElasticSearch if installed in runtime/elasticsearch. To install the Linux, Mac, or Windows no-JDK version of ElasticSearch download and expand the archive manually in runtime/elasticsearch or use the Gradle download task:

The archive to deploy is basically just the moqui-plus-runtime.war file. The WAR file must be renamed from .war to .zip so that the AWS Java SE environment treats it like a plain archive and not an executable jar. To build a file to upload to AWS ElasticBeanstalk do something like:

Then upload the ZIP file in the Elastic Beanstalk section of the AWS Console when you create your Java SE environment.

You'll also need to set various environment variables in your Elastic Beanstalk settings (under Configuration => Software Configuration) for database, host, and other settings. See the Environment Variables section above for a list of which to set.

Typically these settings will include host and other database information for a RDS instance running MySQL, Postgres, or other. Make sure the VPC Security Group for the RDS instance (automatically created when you create the DB instance) has an inbound rule with a VPC Security Group that your Elastic Beanstalk configuration is in (specified in Configuration => Instance). This is done in the VPC section of the AWS Console under Security Groups.

The smallest recommended servers to use are t2.small for the EC2 instance and t2.micro for the RDS instance for a total cost generally under $40/mo depending whether a reserved instance is used, how much disk space is used, etc. Note that for larger EC2 instances make sure to adjust the Procfile so that the maximum heap size is higher, usually roughly half of total memory for the instance if there is nothing else running on it.

The main place to put your components is in the runtime/component directory. When you use the Gradle get component tasks this is where they will go.

Components with declared dependencies (in a component.xml file in the component directory) will be loaded after the component(s) they depend on.

**Examples:**

Example 1 (unknown):
```unknown
<datasource group-name="transactional" database-conf-name="h2" schema-name=""
        start-server-args="-tcpPort 9092 -ifExists -baseDir ${moqui.runtime}/db/h2">
    <!-- with this setup you can connect remotely using "jdbc:h2:tcp://localhost:9092/MoquiDEFAULT" -->
    <inline-jdbc pool-minsize="5" pool-maxsize="50">
        <xa-properties url="jdbc:h2:${moqui.runtime}/db/h2/MoquiDEFAULT" user="sa" password="sa"/>
    </inline-jdbc>
</datasource>
```

Example 2 (unknown):
```unknown
<datasource group-name="transactional" database-conf-name="h2" schema-name=""
        start-server-args="-tcpPort 9092 -ifExists -baseDir ${moqui.runtime}/db/h2">
    <!-- with this setup you can connect remotely using "jdbc:h2:tcp://localhost:9092/MoquiDEFAULT" -->
    <inline-jdbc pool-minsize="5" pool-maxsize="50">
        <xa-properties url="jdbc:h2:${moqui.runtime}/db/h2/MoquiDEFAULT" user="sa" password="sa"/>
    </inline-jdbc>
</datasource>
```

Example 3 (unknown):
```unknown
<datasource group-name="transactional" database-conf-name="mysql" schema-name="">
    <inline-jdbc pool-minsize="5" pool-maxsize="50">
        <xa-properties user="moqui" password="CHANGEME" pinGlobalTxToPhysicalConnection="true"
                serverName="127.0.0.1" port="3306" databaseName="moqui" autoReconnectForPools="true"
                useUnicode="true" encoding="UTF-8"/>
    </inline-jdbc>
</datasource>
```

Example 4 (unknown):
```unknown
<datasource group-name="transactional" database-conf-name="mysql" schema-name="">
    <inline-jdbc pool-minsize="5" pool-maxsize="50">
        <xa-properties user="moqui" password="CHANGEME" pinGlobalTxToPhysicalConnection="true"
                serverName="127.0.0.1" port="3306" databaseName="moqui" autoReconnectForPools="true"
                useUnicode="true" encoding="UTF-8"/>
    </inline-jdbc>
</datasource>
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/User+Interface

**Contents:**
      - Wiki Spaces
      - Page Tree
- User Interface

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

The main artifact for building user interfaces in Moqui Framework is the XML Screen.

XML Screens are designed to be used with multiple render modes using the same screen definition. This includes various types of text output for user and system interfaces, and code-driven user interfaces in client applications.

To accommodate this design goal most screen elements are render mode agnostic. For elements that are specific to a particular render mode there is a render-mode element with subelements designed for specific render modes. To support multiple render mode specific elements in the same screen just put a subelement under the render-mode element for each desired type.

In a web-based application a XML Screen is the main way to produce output for incoming requests. The structure of screens makes it easy to support any sort of URL to a screen.

In this section we cover the following topics-

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Security

**Contents:**
      - Wiki Spaces
      - Page Tree
- Security
- Authentication
- Simple Permissions
- Artifact-Aware Authorization
  - Artifact Execution Stack and History
  - Artifact Authz
  - Entity Filter Sets and Authorization
- Artifact Tarpit

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

The main code path for user authentication starts with a call to the UserFacade.loginUser() method. This calls into Apache Shiro for the actual authentication. This is basically what the code looks like to authenticate using the Shiro SecurityManager that the ExecutionContextFactoryImpl keeps internally:

Shiro is configured by default to use the MoquiShiroRealm so this ends up in a call to the MoquiShiroRealm.getAuthenticationInfo() method, which authenticates using the moqui.security.UserAccount entity and handles things like disabled accounts, keeping track of failed login attempts, etc. Here are the lines from the shiro.ini file where this is configured:

Shiro can be configured to use other authentication realms such as the CasRealm, JdbcRealm, or JndiLdapRealm classes that come with Shiro. You can also implement your own, or even modify the MoquiShiroRealm class to better suit your needs. Shiro has documentation for writing your own realm, and each of these classes has documentation on configuration, such as this JavaDoc for JndiLdapRealm to use it with an LDAP server:

http://shiro.apache.org/static/1.4.0/apidocs/org/apache/shiro/realm/ldap/JndiLdapRealm.html

Back to the MoquiShiroRealm that is used by default, here is its default configuration from the MoquiDefaultConf.xml file that can be overridden in your runtime Moqui Conf XML file:

The login element configures the max number of login failures to allow before disabling a UserAccount (max-failures), how long to disable the account when the max failures is reached (disable-minutes), whether to store a history of login attempts in the UserLoginHistory entity (history-store) and whether to persist incorrect passwords in the history (history-incorrect-password).

The login-key element is used to configure login/api key. encrypt-hash-type tells which hash algorithm to use and expire-hours tells how long it takes to expire.

The password element is used to configure the password constraints that are checked when creating an account (org.moqui.impl.UserServices.create#UserAccount) or updating a password (org.moqui.impl.UserServices.update#Password).

Settings include the hash algorithm to use for passwords before persisting them and before comparing an entered password (encrypt-hash-type; MD5, SHA, SHA-256, SHA-384, SHA512), the minimum password length (min-length), the minimum number of digit characters in the password (min-digits), the minimum number of characters other than digits or letters (min-others), how many old passwords to remember on password change to avoid use of the same password (history-limit), and how many weeks before forcing a password change (change-weeks).

The main way to reset a forgotten password is by an email that includes a randomly generated password. The email-require-change attribute specifies whether to require a change on the first login with the password from the email, making it a temporary password. The email-expire-hours attribute specifies how many hours before the password in the email expires.

The most basic for of authorization (authz) is a permission explicitly checked by code. Artifact-aware authz (covered in the next section) is generally more flexible as it is configured external to the artifact (screen, service, etc) and is inheritable to avoid issues when artifacts (especially services) are reused.

The API method to check permissions is the ec.user.hasPermission(String userPermissionId) method. A user has a permission if the user is a member (UserGroupMember) of a group (UserGroup) that has the permission (UserGroupPermission). The userPermissionId may point to a UserPermission record, but it may also be any arbitrary text value as the UserGroupPermission has no foreign key to UserPermission.

The artifact-aware authorization in Moqui enables external configuration of access to artifacts such as screens, screen transitions, services, and even entities. With this approach there is no need to add code or configuration to each artifact to check permissions or otherwise see if the current user has access to the artifact.

The ArtifactExecutionFacade is used by all parts of the framework to keep track of each artifact as it executes. It keeps a stack of the currently executing artifacts, each one pushed on the stack as it begins (with one of the push() methods) and popped from the stack as it ends (with the pop() method). As each artifact is pushed on to the stack it is also added to a history of all artifacts used in the current ExecutionContext (i.e., for a single web request, remote service call, etc).

Use the ArtifactExecutionInfo peek() method to get info about the artifact at the top of the stack, Deque<ArtifactExecutionInfo> getStack() to get the entire current stack, and List<ArtifactExecutionInfo> getHistory() to get a history of all artifacts executed.

This is important for artifact-aware authorization because authz records are inheritable. If an artifact authz is configured inheritable then not only is that artifact authorized but any artifact it uses is also authorized.

Imagine a system with hundreds of screens and transitions, thousands of services, and hundreds of entities. Configuring authorization for every one of them would require a massive effort to both setup initially and to maintain over time. It would also be very prone to error, both incorrectly allowing and denying access to artifacts and resulting in exposure of sensitive data or functionality, or runtime errors for users trying to perform critical operations that are a valid part of their job.

The solution is inheritable authorization. With this you can setup access to an entire application or part of an application with authz configuration for a single screen that all sub-screens, transitions, services, and entities will inherit. To limit the scope sensitive services and entities can have a deny authz that overrides the inheritable authz, requiring special authorization to those artifacts. With this approach you have a combination of flexibility, simplicity, and granular control of sensitive resources.

This is also used to track performance metrics for each artifact. See the Artifact Execution Runtime Profiling section for details.

The first step to configure artifact authorization is to create a group of artifacts. This involves a ArtifactGroup record and a ArtifactGroupMember record for each artifact, or artifact name pattern, in the group.

For example here is the artifact group for the Example app with the root screen (ExampleApp.xml) as a member of the group:

In this case the artifactName attribute has the literal value for the location of the screen. It can also be a pattern for the artifact name (with nameIsPattern="Y"), which is especially useful for authz for all services or entities in a package. Here is an example of that for all services in the org.moqui.example package, or more specifically all services whose full name matches the regular expression "org.moqui.example..*":

The next step is to configure authorization for the artifact group with a ArtifactAuthz record. Below is an example of a record that gives the ADMIN group always (AUTHZT_ALWAYS) access for all actions (AUTHZA_ALL) to the artifacts in the EXAMPLE_APP artifact group setup above.

The always type (authzTypeEnumId) of authorization overrides deny (AUTHZT_DENY) authorizations, unlike the allow authz (AUTHZT_ALLOW) which is overridden by deny. The other options for the authz action (authzActionEnumId) include view (AUTHZA_VIEW), create (AUTHZA_CREATE), update (AUTHZA_UPDATE), and delete (AUTHZA_DELETE) in addition to all (AUTHZA_ALL).

For example here is a record that grants only view authz with the type allow (so can be denied) of the same artifact group to the EXAMPLE_VIEWER group:

Entity artifact authorization can also be restricted to particular records using the ArtifactAuthzRecord entity. This is used with a view entity (viewEntityName) that joins between the userId of the currently logged in user and the desired record. If the name of the field with the userId is anything other than userId specify its name with the userIdField field. The record level authz is checked by doing a query on the view entity with the current userId and the PK fields of the entity the operation is being done on. To add constraints to this query you can add them to the view-entity definition, use the filterByDate attribute, or use ArtifactAuthzRecordCond records to specify conditions.

If authorization fails when an artifact is used the framework creates a ArtifactAuthzFailure record with relevant details.

Automatic query augmentation (adding conditions to find/select queries) can be used to filter records by configuration using the ArtifactAuthzFilter entity. This tries record level authorization to application (screen/etc) authorization. Each filter set associated with an ArtifactAuthz has various condition expressions stored using the EntityFilterSet entity.

Each record has an Entity Name for the entity that should be filtered when queried on (either directly or through a view-entity, ie joined into a query). Each record also has a Filter Map which is a Groovy expression that should evaluate to a Map. While filtering can be done on view entities it is not a good practice as data leakage is easy through direct entity finds or other view entities so filters are generally defined only on plain entities and not view entities.

For view entities and dynamic view entities, which includes DataDocument based dynamic view entities, in order for a filter to apply to a query the fields used in each filter must be included in the definition. This means that entities with a filter must also be included in the view. For example any view entity or report on OrderItem should also include the customerPartyId and vendorPartyId fields on the OrderPart entity for active or user organization based filtering.

The Groovy expressions can be somewhat complex to interpret so below is a list of the entities with a filter and the fields and logic involved. The main OOTB example in Moqui is in the Mantle USL component for organization based record filtering. The expressions use two variables that are always available (populated in always-actions in the root screen of any application that should support organization based filters): ‘activeOrgId’ for the ID of the user selected active organization and ‘filterOrgIds’ which is a set of IDs that should be used to filter the results, either just the activeOrgId or if no active org then all partyIds of organizations the current user is a member of.

An artifact tarpit limits the velocity of access to artifacts in a group. Here is an example of an artifact group for all screens and a ArtifactTarpit to restrict access for all users to each screen for 60 seconds (tarpitDuration) if there are more than 120 hits (maxHitsCount) within 60 seconds (maxHitsDuration).

When a particular user (userId) exceeds the configured velocity limit for a particular artifact (artifactName) or a particular type (artifactTypeEnumId) the framework creates a ArtifactTarpitLock record to restrict access to that artifact by the user until a certain date/time (releaseDateTime).

**Examples:**

Example 1 (unknown):
```unknown
UsernamePasswordToken token = new UsernamePasswordToken(username, password)
Subject loginSubject = eci.getEcfi().getSecurityManager() .createSubject(new DefaultSubjectContext())
loginSubject.login(token)
```

Example 2 (unknown):
```unknown
UsernamePasswordToken token = new UsernamePasswordToken(username, password)
Subject loginSubject = eci.getEcfi().getSecurityManager() .createSubject(new DefaultSubjectContext())
loginSubject.login(token)
```

Example 3 (unknown):
```unknown
moquiRealm = org.moqui.impl.util.MoquiShiroRealm
securityManager.realms = $moquiRealm
```

Example 4 (unknown):
```unknown
moquiRealm = org.moqui.impl.util.MoquiShiroRealm
securityManager.realms = $moquiRealm
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/User+Interface/Templates

**Contents:**
      - Wiki Spaces
      - Page Tree
- Templates

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

While a wide variety of screens can be built with XML Forms and the various XML Screen widgets and layout elements. Quite a lot can be done with the OOTB elements. Here is an example of a more complex screen, the Task Summary screen from the HiveMind PM application that is made with only OOTB elements and some custom CSS:

Sometimes you need a more flexible layout, styling, widgets, or custom interactive behavior. For things that will be used in many places, and where you want them to render consistently, add screen and form widgets (including layout elements) using FTL macros to add or extend XML Screen elements. For everything else, especially one-off things, an explicit template is the way to get any sort of HTML output you want.

This is especially useful for custom web site such as corporate or ecommerce sites where custom HTML is needed to get a very specific form and function.

Custom templates also apply to other forms of output like XML, CSS, and XSL-FO. In a XML Screen this is done with the render-mode element and one or more text subelements for each render-mode.text.type to support for the screen. In the current version of Moqui Framework only text output is supported for screen rendering, but in the future or in custom code other elements under the render-mode element could be used to define output for non-text screen rendering such as for GWT or Swing.

If the screen is rendered with a render mode and there is no text subelement with a type matching the active render mode then it will simply render nothing for the block and continue with rendering the screen. The options for the text.type attribute match the type attribute on the screen-facade.screen-text-output element in the Moqui Conf XML file where the macro template to use for each output type is defined. Currently supported options include: csv, html, text, xml, and xsl-fo.

Other attributes (in addition to type) available on the text element include:

The webroot.xml screen is the default root screen in the OOTB runtime directory and has a good example of including templates for different render modes:

This is an example of a screen with subscreens so it has render-mode elements before and after the subscreens-active element to decorate (or wrap) what comes from the subscreens. This shows text elements with a location to include a FTL template and inline text in a CDATA block right under the text element.

**Examples:**

Example 1 (unknown):
```unknown
webroot.xml
```

Example 2 (unknown):
```unknown
<widgets>
  <render-mode>
    <text type="html"
      location="component://webroot/screen/includes/Header.html.ftl"/>
    <text type="xsl-fo" no-boundary-comment="true"
      location="component://webroot/screen/includes/Header.xsl-fo.ftl"/>
  </render-mode>
  <subscreens-active/>
  <render-mode>
    <text type="html"
      location="component://webroot/screen/includes/Footer.html.ftl"/>
    <text type="xsl-fo"><![CDATA[
      ${sri.getAfterScreenWriterText()}
      </fo:flow></fo:page-sequence></fo:root>
      ]]>
    </text>
  </render-mode>
</widgets>
```

Example 3 (unknown):
```unknown
<widgets>
  <render-mode>
    <text type="html"
      location="component://webroot/screen/includes/Header.html.ftl"/>
    <text type="xsl-fo" no-boundary-comment="true"
      location="component://webroot/screen/includes/Header.xsl-fo.ftl"/>
  </render-mode>
  <subscreens-active/>
  <render-mode>
    <text type="html"
      location="component://webroot/screen/includes/Footer.html.ftl"/>
    <text type="xsl-fo"><![CDATA[
      ${sri.getAfterScreenWriterText()}
      </fo:flow></fo:page-sequence></fo:root>
      ]]>
    </text>
  </render-mode>
</widgets>
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Data+and+Resources

**Contents:**
      - Wiki Spaces
      - Page Tree
- Data and Resources

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

In this space we cover the following topics-

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Data+and+Resources/Data+Document

**Contents:**
      - Wiki Spaces
      - Page Tree
- Data Document
- Example
- JSON Object
- Definition
- Generate
- Query

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

A Data Document is assembled from database records into a JSON document or a Java nested Map/List representation of the document.

Below is an example Data Document instance and the DataDocument* records that define it. This example a selection from the HiveMind PM project, which is based on Moqui and Mantle. The document is for a project, which is a type of WorkEffort.

These are the database records defining the Data Document, in the format of records in an Entity Facade XML file:

The top level object (the JSON term, Map in Java) of the Data Document instance has 3 fields that identify the document:

The top level also contains a _timestamp field with the date and time the document was generated.

These 4 fields are named the way they are for easy indexing with ElasticSearch, which is the tool used by the Data Search feature which is based on the Data Document feature. These fields, and Data Documents in general, are useful for notifications, integrations, and various things other than just search.

A Data Document definition is made up of these records:

DataDocument: The main record, identified by a dataDocumentId and contains the index name, document name (for display purposes)

DataDocumentField: Each record specifies a field for the document.

DataDocumentRelAlias: Use these records to produce a cleaner document by specifying an alias for relationships in fieldPath fields, and for the primaryEntityName.

DataDocumentCondition: These records constrain the query that gets data for the document from the database. In the example above this is used to constrain the query to only get WorkEffort records with the WetProject type so it only includes projects.

DataDocumentLink: In search results and other user and system interfaces it is useful to have a link to where more information about the document, especially the primary entity in it, is available. Use these records to specify such links. Note that the linkUrl value is expanded using a flattened Map from the Data Document, so names of expanded fields must match document field names (or aliases).

In the top level object of the example document there is a WorkEffort object for the primary entity in the document. There will always be an object like this in the document and its name will be the name of the primary entity. It will be the literal value of the DataDocument.primaryEntityName field unless it is aliased in a DataDocumentRelAlias record, which is why in this document that named of the object is WorkEffort and not mantle.work.effort.WorkEffort.

All DataDocumentField records with a fieldPath with plain field names (no colon-separated relationship prefix) map to fields on the primary entity and will be included in the primary entity’s object in the document.

All document fields with a colon-separated relationship name prefix will result in other entries in the top level document object (Map) with the entry key as the relationship name or the alias for the relationship name if one is configured. The value for that entry will be an object/Map if it is a type one relationship, or an array of objects (in Java a List of Maps) if it is a type many relationship.

The same pattern applies when there is more than one colon-separated relationship name in a fieldPath. The object/Map entries will be nested as needed to follow the path to the specified field. An example of this from the HmProject document example above is the "mantle.work.effort.WorkEffortParty:mantle.party.RoleType:description" fieldPath value. Note that the two relationship names are aliased to exclude the package names, and the field is aliased to be role instead of description. The result is this part of the JSON document:

The JSON syntax for an object (Map) is curly braces ({ }) and for an array (List) is square braces ([ ]). So what we have above is the top-level object with a Party entry whose value is an array with an object in it that has a RoleType entry whose value is an object with a single entry with the key role and the value is from the RoleType.description entity field. The reason the description field is aliased as role is the one described above in the description for the DataDocumentField.fieldNameAlias field: each field in a Data Document must have a unique name across the entire document.

There are a few ways to generate a Data Document from data in a database. The most generally useful approach is the Data Feed described below, but you can also get it through an API call that looks like this:

In the List returned each Map represents a Data Document. The condition, fromUpdatedStamp and thruUpdatedStamp parameters can all be null, but if specified are used as additional constraints when querying the database. The condition should use the field alias names for the fields in the document. To see if any part of the document has changed in a certain time range the UpdatedStamp parameters are used to look for any record in any of the entities with the automatically added lastUpdatedStamp field in the from/thru range.

The Map for a Data Document is structured the same way as the example JSON document above. The ElasticSearch API supports this Map form of a document, but in some cases you will want it as a JSON String. To create a JSON String from the Map in Groovy use a simple statement like this:

If you want a more friendly human-readable version of the JSON String do this:

To go the other way (get a Map representation from a JSON String) use a statement like this:

A Dynamic View Entity can be created automatically based on a Data Document definition to run queries (finds) on the joined in entities and aliased fields. To do this just use an entity name with the following pattern: DataDocument.${dataDocumentId}

This is one reason to keep dataDocumentId values simple (letters, numbers, underscore; camel cased or underscore separated). For example, in Groovy:

This will find all records using a Dynamic View Entity generated from the MantleProduct Data Document (from mantle-udm). The Dynamic View Entity will join in all entities needed for the aliased fields.

**Examples:**

Example 1 (unknown):
```unknown
{
    "_index": "hivemind",
    "_type": "HmProject",
    "_id": "HM",
    "_timestamp": "2013-12-27T00:46:07",
    "WorkEffort": 
    {
        "workEffortId": "HM",
        "name": "HiveMind PM Build Out",
        "workEffortTypeEnumId": "WetProject"
    },
    "StatusItem": { "status": "In Progress" },
    WorkEffortType": { "type": "Project" },
    "Party": [
          {
          "Person": { "firstName": "John", "lastName": "Doe" },
          "RoleType": { "role": "Person - Manager" },
          "partyId": "EX_JOHN_DOE"
          },
          {
          "Person": { "firstName": "Joe", "lastName": "Developer" },
          "RoleType": { "role": "Person - Worker" },
          "partyId": "ORG_BIZI_JD"
          }
    ]
}
```

Example 2 (unknown):
```unknown
{
    "_index": "hivemind",
    "_type": "HmProject",
    "_id": "HM",
    "_timestamp": "2013-12-27T00:46:07",
    "WorkEffort": 
    {
        "workEffortId": "HM",
        "name": "HiveMind PM Build Out",
        "workEffortTypeEnumId": "WetProject"
    },
    "StatusItem": { "status": "In Progress" },
    WorkEffortType": { "type": "Project" },
    "Party": [
          {
          "Person": { "firstName": "John", "lastName": "Doe" },
          "RoleType": { "role": "Person - Manager" },
          "partyId": "EX_JOHN_DOE"
          },
          {
          "Person": { "firstName": "Joe", "lastName": "Developer" },
          "RoleType": { "role": "Person - Worker" },
          "partyId": "ORG_BIZI_JD"
          }
    ]
}
```

Example 3 (unknown):
```unknown
<moqui.entity.document.DataDocument dataDocumentId="HmProject" indexName="hivemind" documentName="Project" primaryEntityName="mantle.work.effort.WorkEffort" documentTitle="${name}"/>

<moqui.entity.document.DataDocumentField dataDocumentId="HmProject" fieldPath="workEffortId"/>

<moqui.entity.document.DataDocumentField dataDocumentId="HmProject"  fieldPath="workEffortName" fieldNameAlias="name"/>

<!-- this is aliased so we can have a condition on it -->

<moqui.entity.document.DataDocumentField dataDocumentId="HmProject"  fieldPath="workEffortTypeEnumId"/>

<moqui.entity.document.DataDocumentField dataDocumentId="HmProject"  fieldPath="WorkEffort#moqui.basic.StatusItem:description"
fieldNameAlias="status"/>

<moqui.entity.document.DataDocumentField dataDocumentId="HmProject" fieldPath="mantle.work.effort.WorkEffortParty:partyId"/>

<moqui.entity.document.DataDocumentField dataDocumentId="HmProject" fieldPath="mantle.work.effort.WorkEffortParty:mantle.party.RoleType:description"
fieldNameAlias="role"/>

<moqui.entity.document.DataDocumentRelAlias dataDocumentId="HmProject" relationshipName="mantle.work.effort.WorkEffort" documentAlias="WorkEffort"/>

<moqui.entity.document.DataDocumentRelAlias dataDocumentId="HmProject" relationshipName="WorkEffort#moqui.basic.StatusItem"
documentAlias="StatusItem"/>

<moqui.entity.document.DataDocumentRelAlias dataDocumentId="HmProject" relationshipName="mantle.work.effort.WorkEffortParty" documentAlias="Party"/>

<moqui.entity.document.DataDocumentRelAlias dataDocumentId="HmProject"  relationshipName="mantle.party.RoleType" documentAlias="RoleType"/>

<moqui.entity.document.DataDocumentCondition dataDocumentId="HmProject"  fieldNameAlias="workEffortTypeEnumId" fieldValue="WetProject"/>

<moqui.entity.document.DataDocumentLink dataDocumentId="HmProject"  label="Edit Project"  linkUrl="/apps/hm/Project/EditProject?workEffortId=${workEffortId}"/>
```

Example 4 (unknown):
```unknown
<moqui.entity.document.DataDocument dataDocumentId="HmProject" indexName="hivemind" documentName="Project" primaryEntityName="mantle.work.effort.WorkEffort" documentTitle="${name}"/>

<moqui.entity.document.DataDocumentField dataDocumentId="HmProject" fieldPath="workEffortId"/>

<moqui.entity.document.DataDocumentField dataDocumentId="HmProject"  fieldPath="workEffortName" fieldNameAlias="name"/>

<!-- this is aliased so we can have a condition on it -->

<moqui.entity.document.DataDocumentField dataDocumentId="HmProject"  fieldPath="workEffortTypeEnumId"/>

<moqui.entity.document.DataDocumentField dataDocumentId="HmProject"  fieldPath="WorkEffort#moqui.basic.StatusItem:description"
fieldNameAlias="status"/>

<moqui.entity.document.DataDocumentField dataDocumentId="HmProject" fieldPath="mantle.work.effort.WorkEffortParty:partyId"/>

<moqui.entity.document.DataDocumentField dataDocumentId="HmProject" fieldPath="mantle.work.effort.WorkEffortParty:mantle.party.RoleType:description"
fieldNameAlias="role"/>

<moqui.entity.document.DataDocumentRelAlias dataDocumentId="HmProject" relationshipName="mantle.work.effort.WorkEffort" documentAlias="WorkEffort"/>

<moqui.entity.document.DataDocumentRelAlias dataDocumentId="HmProject" relationshipName="WorkEffort#moqui.basic.StatusItem"
documentAlias="StatusItem"/>

<moqui.entity.document.DataDocumentRelAlias dataDocumentId="HmProject" relationshipName="mantle.work.effort.WorkEffortParty" documentAlias="Party"/>

<moqui.entity.document.DataDocumentRelAlias dataDocumentId="HmProject"  relationshipName="mantle.party.RoleType" documentAlias="RoleType"/>

<moqui.entity.document.DataDocumentCondition dataDocumentId="HmProject"  fieldNameAlias="workEffortTypeEnumId" fieldValue="WetProject"/>

<moqui.entity.document.DataDocumentLink dataDocumentId="HmProject"  label="Edit Project"  linkUrl="/apps/hm/Project/EditProject?workEffortId=${workEffortId}"/>
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Framework+Features

**Contents:**
      - Wiki Spaces
      - Page Tree
- Moqui Framework Features (through 2.0.0)
- Big Ideas
- Flexible deployment
- Clustering Support
- Default Runtime
- Technical Features
- Developer Friendly API
- Security

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

Moqui Framework gives you flexible tools to quickly create functional and secure applications.

Moqui Framework helps you build applications quickly and scale complex applications to hundreds of thousands of lines of efficient, well organized code instead of millions of lines of mess. Along the way you work on only what you care about, and let the framework take care of the rest.

Comprehensive: Moqui Framework is designed to provide comprehensive infrastructure for enterprise applications and handle common things so you can focus your efforts on the business requirements, whether it be for a multi-organizational ERP system, an interactive community web site, or even a bit of simple content with a few forms thrown into the mix.

Automatic Functionality: By using the tools and practices recommended for the framework you can easily build complex applications with most security and performance concerns taken care of for you.

No Code Generation: Moqui relies on dynamic runtime functionality to avoid the need for code generation. This keeps your development artifacts small and easy to maintain, not just easy to create.

True 3-Tier Architecture: Many modern frameworks have tools for database interaction and user interaction but you have to roll your own logic layer. Moqui has a strongly defined and feature rich logic layer built around service-oriented principles. This makes it easy to build a service library for internal application use, and automatically expose services externally as needed.

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Performance

**Contents:**
      - Wiki Spaces
      - Page Tree
- Performance
- Performance Metrics
  - Artifact Hit Statistics
  - Artifact Execution Runtime Profiling
- Improving Performance

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

Moqui keeps statistics about use (hits) and timing for artifacts according to the configuration in the server-stats.artifact-stats elements in the Moqui Conf XML file. Here is the default configuration (in MoquiDefaultConf.xml) that you can override in the runtime conf file. The default development runtime conf file (MoquiDevConf.xml) has settings that record even more than this.

These settings create a ArtifactHit record for each hit to a screen, screen-content (content under a screen), and screen transition. They also create ArtifactHitBin records for those plus service calls.

Here are a couple of examples of ArtifactHit records, the first for a hit to the FindExample.xml screen and the second for a hit to the EntityExport.xml transition in the DataExport.xml screen in the tools application. The hit to the EntityExport.xml transition has parameters which are recorded in the parameterString attribute.

In a web application there is a Visit record for each session that has details about the session and ties together ArtifactHit records by the visitId. The Visit will keep track of the logged in userId once a user is logged in, but even before that visits are tied together using a visitorId that is tracked on the service in a Visitor record and in a browser/client with a cookie to tie sessions together, even if no user is logged in during a session.

There is a performance impact for creating a record for each hit on an artifact, and on busy servers the database size can get very large. This can be mitigated by using a low-latency insert database such as OrientDB or other NoSQL databases. If you just want statistics of performance over a time period and don’t need the individual hit records for auditing or detailed analysis the ArtifactHitBin records will do the trick.

These records have a summary of hits for an artifact during a time period, between binStartDateTime and binEndDateTime. The length of the bin is configured with the server-stats.bin-length-seconds attribute and defaults to 900 seconds (15 minutes).

Here is an example of a hit bin for the create#moqui.entity.EntityAuditLog service. In this example it has been hit/used 77 times with a total (cumulative) run time of 252ms which means the average run time for the artifact in the bin is 3.27ms.

These can be used directly from the database and with the Artifact Bins and Artifact Summary screens in the Tools application.

Java profilers such as JProfiler are great tools for analyzing the performance of Java methods but know nothing about Moqui artifacts such as screens, transitions, services, and entities. The Moqui Artifact Execution Facade keeps track of performance details of artifacts in memory for each instance (each ExecutionContext, such as a web request, etc) as they run.

This data is kept in with the ArtifactExecutionInfo objects that are created as each artifact runs and are pushed onto the execution stack and kept in the execution history. You can access these using the ec.artifactExecution.getStack(), and ec.artifactExecution.getHistory() methods.

From the ArtifactExecutionInfo instance you can get its own runtime (long getRunningTime()), the artifact that called it (ArtifactExecutionInfo getParent()), the artifacts it calls (List<ArtifactExecutionInfo> getChildList()), the running time of all artifacts called by this artifact (long getChildrenRunningTime()), and based on that the running time of just this artifact (long getThisRunningTime(), which is getRunningTime() - getChildrenRunningTime()). You can also print a report with these stats for the current artifact info and optionally its children recursively using the print(Writer writer, int level, boolean children) method.

For a complex code section like placing an order that does dozens of service calls this can be a lot of data. To make it easier to track down the parts that are taking the most time have this method on the ArtifactExecutionInfoImpl class to generate a list of hot spots:

This goes through all ArtifactExecutionInfoImpl instances in the execution history and sums up stats to create a Map for each artifact with the following entries: time, timeMin, timeMax, count, name, actionDetail, artifact type, and artifact action.

Another situation where you’ll have a LOT of data is when running a process many times to get better average statistics. In this case you could have hundreds or thousands of artifact execution infos in the history. To consolidate data from multiple runs into a single tree of info about the execution of each artifact and its children use this method:

Each Map has these entries: time, thisTime, childrenTime, count, name, actionDetail, childInfoList, key (which is: name + ":" + typeEnumId + ":" + actionEnumId + ":" + actionDetail), type, and action. With that result you can print the tree with indentation in plain text (best displayed with a fixed width font) with this method:

One example of using these methods is the TestOrders.xml screen in the POP Commerce application. It is used with a URL like this and display a screen with the performance profile results of the code that places and ships the specified number of orders:

http://localhost:8080/popc/TestOrders?numOrders=10

Here is a snippet from the screen actions script that runs the test code and gets the performance statistics using the methods described above:

Here is an example of the top few rows in the Artifacts by Own Time section of the output on that screen for the placing and shipping of 25 orders:

From these results we can see that the most time is spent doing an Entity View (find) list operation on the OrderItem entity. In this run the transaction cache for the place#Order and ship#OrderPart services was disabled, and the OrderItem entity is not cached using the entity cache so it is doing that query 801 times during this run. The transaction cache is a write-through cache that will cache written records and reads like this. With that enabled overall the orders per second goes from around 0.8 to 1.4 (on my laptop with a Derby database) and the output for Artifacts by Own Time looks very different:

Below is some sample output from the Consolidated Artifacts Tree section. It shows the hierarchy of artifacts consolidated across runs and within each run to show the data for each artifact in the context of parent and child artifacts. When interpreting these results note that the total counts and times for each artifact are not just the values for that artifact running as a child of the parent artifact shown, but all runs of that artifact. The main value is tracking down where the busiest artifacts are used, and understanding exactly what is actually done at runtime, especially for specific services.

In this output each line is formatted as follows:

Here is the sample output, note that certain artifact names have been shortened with ellipses for better formatting:

Once an artifact or code block has been identified a taking up a lot of execution time the next step is to review it and see if any part of it can be improved. Sometimes operations just take time and there isn’t much to be done about it. Even in those cases parts can be made asynchronous or other approaches used to at least minimize the impact on users or system resources.

The slowest operations typically involve database or file access and in-memory caching can help a lot with this. The Moqui Cache Facade is used by various parts of the framework and can be used directly by your code for caching as needed. By default Moqui uses ehcache for the actual caching, and the configuration settings in the Moqui Conf XML file are passed through to it. Other cache configuration is ehcache specific and can be setup using its files (mainly ehcache.xml). This is especially true for setting up things like a distributed caching in an app server cluster.

In the runtime configuration for development (MoquiDevConf.xml) the caches for artifacts such as entities, service definitions, XML Screens, scripts, and templates have a short timeout so that they are reloaded frequently for testing after changing a file. In the production configuration (MoquiProductionConf.xml) the caches are all used fully to get the best performance. When doing performance testing make sure you are running with the caches fully used, i.e. with production settings, so that numbers are not biased by things that are quite slow and won’t happen in production.

The Resources Facade does a lot of caching. The getLocationText(String location, boolean cache) method uses the resource.text.location cache is the cache parameter is set to true. Other caches are always used including scripts and templates in their compiled form (if possible with the script interpreter or template renderer), and even the Groovy expressions and string expansions done by the Resource Facade. As mentioned above these are never "disabled" but to facilitate runtime reloading the easiest approach is to use a timeout on the desired caches.

Another common cache is the entity cache managed by the Entity Facade. There are caches for individual records, list results, and count results. These caches are cleared automatically when records are created, updated, or deleted through the Entity Facade. Both simple entities that correspond to a single table and view entities can be cached, and the automatic cache clearing works for both. To make cache clearing more efficient it uses a reverse association cache by default to lookup cache entries by the entity name and PK values of a record. In other cases (such as when creating a record) it must do a scan of the conditions on cache entries to find matching entries to clear, especially on list and count caches. For more details see the Data and Resources chapter.

In addition to the entity read cache there is a write-through per-transaction cache that can be enabled with the service.transaction attribute by setting it to cache or force-cache. The implementation of this is in the TransactionCache.groovy file.

The basic idea is that when creating, updating, or deleting a record it just remembers that in an object that is associated with the transaction instead of actually writing it to the database. When the transaction is committed, but before the actual commit, it writes the changes to the database. When find operations are done it uses the values in cache directly or augments the query results from the database with values in the cache.

It is even smart enough to know when finding with a constraint that could only match values in the TX cache (created through it) that there is no need to go to the database at all and the query is handled fully in memory. For example if you create a OrderHeader record and then various OrderItem records and then query all OrderItem records by orderId it will see if the OrderHeader record was created through the transaction cache and if so it will just get the OrderItem records from the TX cache and not query the database at all for them.

For entity find operations another valuable tool is the auto-minimize of view entities. When you do a find on a large view-entity, such as the FindPartyView entity, just make sure to specify the fields to select and limit those to only the fields you need. The Entity Facade will automatically look at the fields selected, used in conditions, and used to order/sort the results and only include the aliased fields and member entities necessary for those fields. With this approach there is no need to use a dynamic view entity (EntityDynamicView) to conditionally add member entities and aliased fields. Back to the FindPartyView example, the find#Party service (implemented in findParty.groovy) uses this to provide a large number of options with very minimal code.

A general guideline when querying tables with a very large number of records is to not ask the database to do more than is absolutely necessary. Joining in too many member entities in a view entity is a dramatic form of this as creating large temporary tables is a very expensive operation.

Along these lines another common scenario is doing a find that may return a very large number of results and then showing those results one page (like 20 records) at a time. It is best to not select all the data you’ll display for each record in the main query as this makes the temporary table for joins much larger, and you are asking the database to get that data for all records instead of just the 20 or so you will be displaying. A better approach is to just query the field or fields sufficient to identify the records, then query the data to display for just those keys in a separate find. This is usually much faster, but in some rare cases it is not so it is still good to test these and other query variations with real data to see which performs best for your specific scenario.

In high volume production ecommerce and ERP systems another common problem is synchronization and locking delays. These can happen within the app server with Java synchronization, or in a database with locks and lock waiting. You may also find deadlocks, but that is another issue (i.e., separate from performance). The only way to really find these is with load testing, especially load testing that uses the same resources as much as possible like a bunch of orders for the same product as close to the same time as possible.

There are a few ways to improve these. On the Java synchronization level using non-blocking algorithms and data structures can make a huge difference, and many libraries are moving this way. Java Concurrency in Practice by Brian Goetz is a good book on this topic.

Beyond these basic things to keep in mind there are countless ways to improve performance. For really important code, especially highly used or generally performance sensitive functionality, within reasonable constraints the only limit to how much faster it can run is often a matter of how much time and effort can be put into performance testing and optimization.

Sometimes this involves significant creativity and using very different architectures and tools to handle things like a large number of users, a very large amount of data, data scattered in many places, and so on. For some of these issues distributed processing or data storage tools such as Hadoop and OrientDB (and really countless others these days) may be just what you need, even if using them requires significantly more effort and it only makes sense to do so for very specific functionality.

When doing Java profiling with a tool like JProfiler you are usually looking for different sorts of things that impact performance than when looking at Moqui artifact execution performance data. To optimize Java methods (and classes for memory use) there are different tools and guidelines to use than the ones above which are more for optimizing business logic at a higher level.

**Examples:**

Example 1 (unknown):
```unknown
<server-stats bin-length-seconds="900" visit-enabled="true" visit-ip-info-on-login="true" visitor-enabled="true">
        <artifact-stats type="AT_XML_SCREEN" persist-bin="true" persist-hit="true"/>
        <artifact-stats type="AT_XML_SCREEN_CONTENT" persist-bin="true" persist-hit="false"/>
        <artifact-stats type="AT_XML_SCREEN_TRANS" persist-bin="true" persist-hit="true"/>
        <artifact-stats type="AT_SERVICE" persist-bin="true" persist-hit="false"/>
        <artifact-stats type="AT_ENTITY" persist-bin="false"/>
</server-stats>
```

Example 2 (unknown):
```unknown
<server-stats bin-length-seconds="900" visit-enabled="true" visit-ip-info-on-login="true" visitor-enabled="true">
        <artifact-stats type="AT_XML_SCREEN" persist-bin="true" persist-hit="true"/>
        <artifact-stats type="AT_XML_SCREEN_CONTENT" persist-bin="true" persist-hit="false"/>
        <artifact-stats type="AT_XML_SCREEN_TRANS" persist-bin="true" persist-hit="true"/>
        <artifact-stats type="AT_SERVICE" persist-bin="true" persist-hit="false"/>
        <artifact-stats type="AT_ENTITY" persist-bin="false"/>
</server-stats>
```

Example 3 (unknown):
```unknown
<moqui.server.ArtifactHit lastUpdatedStamp="1519659626210" artifactType="AT_XML_SCREEN" hitId="120531" artifactSubType="text/html" runningTimeMillis="893.634543" userId="EX_JOHN_DOE" serverHostName="DEJCMBA3.local" startDateTime="1519659623359" visitId="100000" isSlowHit="N" artifactName="component://example/screen/ExampleApp/Example/FindExample.xml" requestUrl="http://localhost:8080/apps/example/Example/FindExample.vuet" wasError="N" serverIpAddress="172.16.7.38"/>
```

Example 4 (unknown):
```unknown
<moqui.server.ArtifactHit lastUpdatedStamp="1519659626210" artifactType="AT_XML_SCREEN" hitId="120531" artifactSubType="text/html" runningTimeMillis="893.634543" userId="EX_JOHN_DOE" serverHostName="DEJCMBA3.local" startDateTime="1519659623359" visitId="100000" isSlowHit="N" artifactName="component://example/screen/ExampleApp/Example/FindExample.xml" requestUrl="http://localhost:8080/apps/example/Example/FindExample.vuet" wasError="N" serverIpAddress="172.16.7.38"/>
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/The+Tools+Application

**Contents:**
      - Wiki Spaces
      - Page Tree
- The Tools Application

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

The Tools application is part of the default Moqui runtime and lives in the base-component at moqui/runtime/ base-component/tools. It has screens for technical administration of systems built on Moqui Framework such as viewing and editing data, running services, managing jobs, managing caches, and viewing statistics about server use.

---

## Moqui Documentation

**URL:** https://www.moqui.org/docs/framework/User+Interface/XML+Screen

**Contents:**
      - Wiki Spaces
      - Page Tree
- XML Screen
- Subscreens
- Standalone Screen
- Screen Transition
- Parameters and Web Settings
- Screen Actions, Pre-Actions, and Always Actions
- XML Screen Widgets
- Section, Condition and Fail-Widgets

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

Screens in Moqui are organized in two ways:

The hierarchy model is used to reference the screen, and in a URL specify which screen to render by its path in the hierarchy. Screens also contain links to other screens (literally a hyperlink or a form submission) that is more like the structure of going from one node to another in a graph through a transition.

The subscreen hierarchy is primarily used to dynamically include another screen, a subscreen or child screen. The subscreens of a screen can also be used to populate a menu.

When a screen is rendered it is done with a root screen and a list of screen names.

The root screen is configured per webapp in the Moqui Conf XML file with the moqui-conf.webapp-list.webapp.root-screen element. Multiple root screens can be configured per webapp based on a hostname pattern, providing a convenient means of virtual hosting within a single webapp.

You should have at least one catchall root-screen element meaning that the host is set to the regular expression ".*". The MoquiDefaultConf.xml file uses the default webroot component and its root screen which you can override in a runtime or component Moqui Conf XML file.

If the list of subscreen names does not reach a leaf screen (with no subscreens) then the default subscreen, specified with the screen.subscreens.default-item attribute will be used. Because of this any screen that has subscreens should have a default subscreen.

There are four ways to add subscreens to a screen:

For #1 (Directory Structure) a directory structure would look something like this (from the Example application):

The pattern to notice is that if there is are subscreens there should be a directory with the same name as the XML Screen file, just without the .xml extension. The Feature.xml file is an example of a screen with subscreens, whereas the FindExampleFeature.xml has no subscreens (it is a leaf in the hierarchy of screens).

For approach #2 (Screen XML File) the subscreens-item element would look something like this element from the apps.xml file used to mount the Example app’s root screen:

For #3 (Database Record) the record in the database in the SubscreensItem entity would look something like this (an adaptation of the XML element above):

For #4 (Moqui Conf XML File) you can put these elements in any of the Moqui Conf XML files that get merged into that runtime configuration. The main way to do this is in a MoquiConf.xml file in your component directory so the configuration is in the same component as the screens and you don't have to modify and maintain files elsewhere. See more details about the Moqui Conf XML options in the Run and Deploy instructions. Here is an example from the MoquiConf.xml file in the moqui/example component:

Within the widgets (visual elements) part your screen you specify where to render the active subscreen using the subscreens-active element. You can also specify where the menu for all subscreens should be rendered using the* subscreens-men*u element. For a single element to do both with a default layout use the subscreens-panel element.

While the full path to a screen will always be explicit, when following the default subscreen item under each screen there can be multiple defaults where all but one have a condition. In the webroot.xml screen there is an example of defaulting to an alternate subscreen for the iPad:

With this in place an explicit screen path will go to either the "apps" subscreen or the "ipad" subscreen, but if neither is explicit it will default to the ipad.xml subscreen if the User-Agent matches, otherwise it will default to the normal apps.xml subscreen. Both of these have the example and tools screen hierarchies under them but have slightly different HTML and CSS to accommodate different platforms.

Once a screen such as the FindExample screen is rendered through one of these two its links will retain that base screen path in URLs generated from relative screen paths so the user will stay in the path the original default pointed to.

Normally screens will be rendered following the render path, starting with the root screen. Each screen along the way may add to the output. A screen further down the path that is rendered without any previous screens in the path adding to the output is a "standalone" screen.

This is useful when you want a screen to control all of its output and not use headers, menus, footers, etc from the screen it is under in the subscreens hierarchy.

There are two ways to make a screen standalone:

The first option is most useful for screens that are the root of an application separate from the rest and that need different decoration and such. The second option is most useful for screens that are sometimes used in the context of an application, and other times used to produce undecorated output like a CSV file or for loading dynamically in a dialog window or screen section.

A transition is defined as a part of a screen and is how you get from one screen to another, processing input if applicable along the way. A transition can of course come right back to the same screen and when processing input often does.

The logic in transitions (transition actions) should be used only for processing input, and not for preparing data for display. That is the job of screen actions which, conversely, should not be used to process input (more on that below).

When a XML Screen is running in a web application the transition comes after the screen in the URL. In any context the transition is the last entry in the list of subscreen path elements. For example the first path goes to the EditExample screen, and the second to the updateExample transition within that screen:

/apps/example/Example/EditExample

/apps/example/Example/EditExample/updateExample

When a transition is the target of a HTTP request any actions associated with the transition will be run, and then a redirect will be sent to ask the HTTP client (usually a web browser) to go to the URL of the screen the transition points to. If the transition has no logic and points right to another screen or external URL when a link is generated to that transition it will automatically go to that other screen or external URL and skip calling the transition altogether. Note that these points only apply to a XML Screen running in a web-based application.

A simple transition that goes from one screen to another, in this case from FindExample to EditExample, looks like this:

The path in the url attribute is based on the location of the two screens as siblings under the same parent screen. In this attribute a simple dot (".") refers to the current screen and two dots ("..") refers to the parent screen, following the same pattern as Unix file paths.

For screens that have input processing the best pattern to use is to have the transition call a single service. With this approach the service is defined to agree with the form that is submitted to the corresponding transition. This makes the designs of both more clear and offers other benefits such as some of the validations on the service definition are used to generate matching client-side validations. When a service-call element is directly under a transition element it is treated a bit differently than if it were in an actions block and it automatically gets in parameters from the context (equivalent to in-map="context") and puts out parameters in the context (equivalent to out-map="context").

This sort of transition would look like this (the updateExample transition on the EditExample screen):

In this case the default-response.url attribute is simple a dot which refers to the current screen and means that after this transition is processed it will go to the current screen.

A screen transition can also have actions instead of a single service call by using the actions element. If a transition has both service-call and actions elements the service-call will be run first and then the actions will be run. Just as with all actions elements in all XML files in Moqui, the subelements are standard Moqui XML Actions that are transformed into a Groovy script. This is what a screen transition with actions might look like (simplified example, also from the FindExample screen):

This example also shows how you would do a simple entity find operation and return the results to the HTTP client as a JSON response. Note the call to the ec.web.sendJsonResponse() method and the none value for the default-response.type attribute telling it to not process any additional response.

As implied by the element default-response you can also conditionally choose a response using the conditional-response element. This element is optional and you can specify any number of them, though you should always have at least one default-response element to be used when none the conditions are met. There is also an optional error-response which you may use to specify the response in the case of an error in the transition actions.

A transition with a conditional-response would look something like this simplified example from the DataExport screen:

This is allowing the script to specify that no response should be sent (when it sends back the data export), otherwise it transitions back to the current screen. Note that the text under the condition.expression element is simply a Groovy expression that will be evaluated as a boolean.

All *-response elements can have parameter subelements that will be used when redirecting to the url or other activating of the target screen. Each screen has a list of expected parameters so this is only necessary when you need to override where the parameter value comes from (default defined in the parameter tag under the screen) or to pass additional parameters.

Here are the shared attributes of the default-response, conditional-response, and error-response elements:

One of the first things in a screen definition is the parameters that are passed to the screen. This is used when building a URL to link to the screen or preparing a context for the screen rendering. You do this using the parameter element, which generally looks something like this:

The name attribute is the only required one, and there are others if you want a default static value (with the value attribute) or to get the value by default from a field in the context other than one matching the parameter name (with the from attribute).

While parameters apply to all render modes there are certain settings that apply only when the screen is rendered in a web-based application. These options are on the screen.web-settings element, including:

Before rendering the visual elements (widgets) of a screen data preparation is done using XML Actions under the screen.actions element. These are the same XML Actions used for services and other tools and are described in the Logic and Services chapter. There are elements for running services and scripts (inline Groovy or any type of script supported through the Resource Facade), doing basic entity and data moving operations, and so on.

Screen actions should be used only for preparing data for output. Use transition actions to process input.

When screens are rendered it is done in the order they are found in the screen path and the actions for each screen are run as each screen in the list is rendered. To run actions before the first screen in the path is rendered use the pre-actions element. This is used mainly for preparing data needed by screens that will include the current screen (i.e., before the current screen in the screen path). When using this keep in mind that a screen can be included by different screens in different circumstances.

If you want actions to run before the screen renders and before any transition is run, then use the always-actions element. The main difference between always-actions and pre-actions is that the pre-actions only run before a screen or subscreen is rendered, while always-actions will run before any transition in the current screen and any transition in any subscreen. The always-actions also run whether the screen will be rendered, while the pre-actions only run if the screen will be rendered (i.e., is below a standalone screen in the path).

The elements under the screen.widgets element are the visual elements that are rendered, or when producing text that actually produce the output text. The most common widgets are XML Forms (using the form-single and form-list elements) and included templates. See the section below for details about XML Forms.

While XML Forms are not specific to any render mode templates by their nature are particular to a specific render mode. This means that to support multiple types of output you’ll need multiple templates. The webroot.xml screen (the default root screen) has an example of including multiple templates for different render modes:

The same screen also has an example of supporting multiple render modes with inline text:

These are the widget elements for displaying basic things:

To structure screens use these widget elements:

A section is a special widget that contains other widgets. It can be used anywhere other screen widget elements are used. A section has widgets, condition, and fail-widgets subelements. The screen element also supports these subelements, making it a sort of top-level section of a screen.

The condition element is used to specify a condition. If it evaluates to true the widgets under the widgets element will be rendered, and if false the widgets under the fail-widgets element will be.

Moqui XML Screen and XML Form files are transformed to the desired output using a set of macros in a Freemarker (FTL) template file. There is one macro for each XML element to produce its output when the screen is rendered.

There are two ways to specify the macro template used to render a screen:

The location of the macro template can be any location supported by the Resource Facade. The most common types of locations you’ll use for this include component, content, and runtime directory locations.

The default macro templates included with Moqui are specified in the MoquiDefaultConf.xml file along with all other default settings. You can override them with your own in the Moqui Conf XML file specified at runtime.

When you use a custom macro template file you don’t need to include a macro for every element you want to render differently. You can start the file with an include of a default macro file or any other macro file you want to use, and then just override the macros for desired elements. An include of another macro file within your file will look something like:

The location here can also be any location supported by the Resource Facade.

You can use this approach to add your own custom elements. In other words, the macros in your custom macro template file don’t have to be an override of one of the stock elements in Moqui, they can be anything you want.

Use this approach to add your own widget elements and form field types that you want to be consistent across screens in your applications. For example you can add macros for special containers with dynamic HTML like the dialogs in the default macros, or a special form field like a slider or a custom form field widget you create with JavaScript.

When you add a macro for a custom element you can just start using it in your XML Screen files even though they are not validated by the XSD file. If you want them to be validated:

Because a single XML Screen file can support output in multiple render modes the render mode to use is selected using a parameter to the screen: the renderMode parameter. For web-based applications this can be a URL parameter. For any application this can be set in a screen action, usually a pre-action (i.e., under the screen.pre-actions element).

The value of this parameter can be any string matching a screen-text-output.type attribute in the Moqui Conf XML file. This includes the OOTB types as well as any you add in your runtime conf file.

All screens in the render path are rendered regardless of the render mode, so for output types where you only want the content of the last screen in the path to be included (like CSV), use the lastStandalone=true parameter along with the renderMode parameter.

**Examples:**

Example 1 (unknown):
```unknown
MoquiDefaultConf.xml
```

Example 2 (unknown):
```unknown
MoquiConf.xml
```

Example 3 (unknown):
```unknown
Feature.xml
```

Example 4 (unknown):
```unknown
FindExampleFeature.xml
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Data+and+Resources/Entity+ECA+Rules

**Contents:**
      - Wiki Spaces
      - Page Tree
- Entity ECA Rules

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

Entity ECA (EECA) rules can be used to trigger actions to run when data is modified or searched. It is useful for maintaining entity fields (database columns) that are based on other entity fields or for updating data in a separate system based on data in this system. EECA rules should not generally be used for triggering business processes because the rules are applied too widely. Service ECA rules are a better tool for triggering processes.

For example here is an EECA rule from the Work.eecas.xml file in Mantle Business Artifacts that calls a service to update the total time worked on a task (WorkEffort) when a TimeEntry is created, updated, or deleted:

An ECA (event-condition-action) rule is a specialized type of rule to conditionally run actions based on events. For Entity ECA rules the events are the various find and modify operations you can do with a record. Set any of these attributes (of the eeca element) to true to trigger the EECA rule on the operation: on-create, on-update, on-delete, on-find-one, on-find-list, on-find-iterator, on-find-count.

By default the EECA rule will run after the entity operation. To have it run before set the run-before attribute to true. There is also a run-on-error attribute which defaults to false and if set to true the EECA rule will be triggered even if there is an error in the entity operation.

When the actions run the context will be whatever context the service was run in, plus the entity field values passed into the operation for convenience in using the values. There are also special context fields added:

The condition element is the same condition as used in XML Actions and may contain expression and compare elements, combined as needed with or, and, and not elements.

The actions element is the same as actions elements in service definitions, screens, forms, etc. It contains a XML Actions script. See the Overview of XML Actions section for more information.

**Examples:**

Example 1 (unknown):
```unknown
<eeca entity="mantle.work.time.TimeEntry" on-create="true" on-update="true" on-delete="true" get-entire-entity="true">
        <condition><expression>workEffortId</expression></condition>
        <actions><service-call name="mantle.work.TaskServices.update#TaskFromTime" in-map="context"/></actions>
</eeca>
```

Example 2 (unknown):
```unknown
<eeca entity="mantle.work.time.TimeEntry" on-create="true" on-update="true" on-delete="true" get-entire-entity="true">
        <condition><expression>workEffortId</expression></condition>
        <actions><service-call name="mantle.work.TaskServices.update#TaskFromTime" in-map="context"/></actions>
</eeca>
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/System+Interfaces

**Contents:**
      - Wiki Spaces
      - Page Tree
- System Interfaces

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

Along with support for user interfaces, Moqui Framework supports various options for interfacing with other systems. There are standards-based options and ways to build more custom system interfaces.

In this section we cover the following topics-

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Logic+and+Services/Calling+Services

**Contents:**
      - Wiki Spaces
      - Page Tree
- Calling Services

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

There are DSL-style interfaces available through the ServiceFacade (ec.getService(), or in Groovy ec.service) that have options applicable to the various ways of calling a service. All of these service call interfaces have name() methods to specify the service name, and parameter() and parameters() methods to specify the input parameters for the service. These and other methods on the various interfaces return an instance of themselves so that calls can be chained. Most have some variation of a call() method to actually call the service.

The first service call is to an implicitly defined entity CrUD service to create a ArtifactHit record asynchronously. Note that for async() the call() method returns nothing and in this case the service call results are ignored. The second is a synchronous call to a defined service with a params input parameter Map, and because it is a sync() call the call() method returns a Map with the results of the service call.

Beyond these basic methods each interface for different ways of calling a service has methods for applicable options, including:

sync(): Call the service synchronously and return the results.

async(): Call the service asynchronously and ignore the results, get back a ServiceResultWaiter object to wait for the results, or pass in an implementation of the ServiceResultReceiver interface to receive the results when the service is complete.

special(): Register the current service to be called when the current transaction is either committed (use registerOnCommit()) or rolled back (use registerOnRollback()). This interface does not have a call() method.

**Examples:**

Example 1 (unknown):
```unknown
Map ahp = [visitId:ec.user.visitId, artifactType:artifactType, ...]
ec.service.async().name("create", "moqui.server.ArtifactHit").parameters(ahp).call()
Map result = ec.service.sync().name("org.moqui.impl.UserServices.create#UserAccount").parameters(params).call()
```

Example 2 (unknown):
```unknown
Map ahp = [visitId:ec.user.visitId, artifactType:artifactType, ...]
ec.service.async().name("create", "moqui.server.ArtifactHit").parameters(ahp).call()
Map result = ec.service.sync().name("org.moqui.impl.UserServices.create#UserAccount").parameters(params).call()
```

Example 3 (unknown):
```unknown
java.util.concurrent.Future
```

Example 4 (unknown):
```unknown
moqui.service.job.ServiceJob
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Data+and+Resources/The+Entity+Facade

**Contents:**
      - Wiki Spaces
      - Page Tree
- The Entity Facade
- Basic CrUD Operations
- Finding Entity Records
  - Flexible Finding with View Entities
    - Static View Entity
    - View Entity Auto Minimize on Find
    - Database Defined View Entity
    - Dynamic View Entity

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

The basic CrUD operations for an entity record are available through the EntityValue interface. There are two main ways to get an EntityValue object:

Once you have an EntityValue object you can call the create(), update(), or delete() methods to perform the desired operation. There is also a createOrUpdate() method that will create a record if it doesn’t exist, or update it if it does.

Note that all of these methods, like many methods on the EntityValue interface, return a self-reference for convenience so that you can chain operations. For example:

While this example is interesting, only in rare cases should you create a record directly using the Entity Facade API (accessed as ec.entity). You should generally do CrUD operations through services, and there are automatic CrUD services for all entities available through the Service Facade. These services have no definition, they exist implicitly and are driven only the entity definition.

We’ll discuss the Service Facade more below in the context of the logic layer, but here is an example of what that operation would look like using an implicit automatic entity service:

Most of the Moqui Framework API methods return a self-reference for convenient chaining of method calls like this. The main difference between the two is that one goes through the Service Facade and the other doesn’t. There are some advantages of going through the Service Facade (such as transaction management, flow control, security options, and so much more), but many things are the same between the two calls including automatic cleanup and type conversion of the fields passed in before performing the underlying operation.

With the implicit automatic entity service you don’t have to explicitly set the sequenced primary ID as it automatically determines that there is a single primary and if it is not present in the parameters passed into the service then it will generate one.

However you do the operation, only the entity fields that are modified or passed in are updated. The EntityValue object will keep track of which fields have been modified and only create or update those when the operation is done in the database. You can ask an EntityValue object if it is modified using the isModified() method, and you can restore it to its state in the database (populating all fields, not just the modified ones) using the refresh() method.

If you want to find all the differences between the field values currently in the EntityValue and the corresponding column values in the database, use the checkAgainstDatabase(List messages) method. This method is used when asserting (as opposed to loading) an entity-facade-xml file and can also be used manually if you want to write Java or Groovy code check the state of data.

Finding entity records is done using the EntityFind interface. Rather than using a number of different methods with different optional parameters through the EntityFind interface you can call methods for the aspects of the find that you care about, and ignore the rest. You can get a find object from the EntityFacade with something like:

Most of the methods on the EntityFind interface return a reference to the object so that you can chain method calls instead of putting them in separate statements. For example a find by the primary on the Example entity would look like this:

The EntityFind interface has methods on it for:

conditions (both where and having)

fields to select with selectField(String fieldToSelect) and/or selectFields(Collection<String> fieldsToSelect)

fields to order the results by

whether or not to cache the results with useCache(Boolean useCache), defaults to the value on the entity definition

the offset and limit to pass to the datasource to limit results

database options including distinct with the distinct(boolean distinct) method and for update with the forUpdate(boolean forUpdate) method

There are various options for conditions, some on the EntityFind interface itself and a more extensive set available through the EntityConditionFactory interface. To get an instance of this interface use the ec.entity.getConditionFactory() method, something like:

For find forms that follow the standard Moqui pattern (used in XML Form find fields and can be used in templates or JSON or XML parameter bodies too), just use the EntityFind.searchFormInputs() method.

Once all of these options have been specified you can do any of these actual operations to get results or make changes:

You probably noticed that the EntityFind interface operates on a single entity. To do a query across multiple entities joined together and represented by a single entity name you can create a static view entity using a XML definition that lives along side normal entity definitions.

A view entity can also be defined in database records (in the DbViewEntity and related entities) or with dynamic view entities built with code using the EntityDynamicView interface (get an instance using the EntityFind.makeEntityDynamicView() method).

A view entity consists of one or more member entities joined together with key mappings and a set of fields aliased from the member entities with optional functions associated with them. The view entity can also have conditions associated with it to encapsulate some sort of constraint on the data to be included in the view.

Here is an example of a view-entity XML snippet from the ExampleViewEntities.xml file in the example component:

Just like an entity a view entity has a name and exists in a package using the entity-name and package-name attributes on the view-entity element.

Each member entity is represented by a member-entity element and is uniquely identified by an alias in the entity-alias attribute. Part of the reason for this is that the same entity can be a member in a view entity multiple times with a different alias for each one.

Note that the second member-entity element also has a join-from-alias attribute to specify that it is joined to the first member entity. Only the first member entity does not have a join-from-alias attribute. If you want the current member entity to be optional in the join (a left outer join in SQL) then just set the join-optional attribute to true.

To describe how the two entities relate to each other use one or more key-map elements under the member-entity element. The key-map element has two attributes: field-name and related. Note that the related attribute is optional when matching the primary key field on the current member entity.

Fields can be aliased in sets using the alias-all element, as in the example above, or individually using the alias element. If you want to have a function on the field then alias them individually with the alias element. Note for SQL databases that if any aliased field has a function then all other fields that don’t have a function but that are selected in the query will be added to the group by clause to avoid invalid SQL.

When doing a query with the Entity Facade EntityFind you can specify fields to select and only those fields will be selected. For view entities this does a little more to give you a big boost in performance without much work.

A common problem with static view entities is that you want to join in a bunch of member entities to provide a lot of options for search screens and similar flexible queries and when you do this the temporary table for the query in the database can get HUGE. When the common use is to only select certain fields and only have conditions and sorting on a limited set of fields you may end up joining in a number of tables that are not actually used. In effect you are asking the database to do a LOT more work that it really needs to for the data you need.

One approach to solving this is to build a EntityDynamicView on the fly and only join in the entities you need for the specific query options used. This works, but is cumbersome.

The easy approach is to just take advantage of the feature in EntityFind that automatically minimizes the fields and entities joined in for each particular query. On a view entity just specify the fields to select, the conditions, and the order by fields. The Entity Facade will automatically go through the view entity definition and only alias the fields that are used for one of these (select, conditions, order by), and only join in the entities with fields that are actually used (or that are need to connect a member entity with other member entities to complete the join).

A good example of this is the FindPartyView view entity defined in the PartyViewEntities.xml file in Mantle Business Artifacts. This view entity has a respectable 13 member entities. Without the automatic minimize that would be 13 tables joined in to every query on it. With millions of customer records or other similarly large party data each query could take a few minutes. When only querying on a few fields and only joining in a small number of member entities and a minimal number of fields, the query gets down to sub-second times.

The actual find is done by the mantle.party.PartyServices.find#Party service. The implementation of this service is a simple 45 line Groovy script (findParty.groovy), and most of that script is just adding conditions to the find based on parameter being specified or not. Doing the same thing with the EntityDynamicView approach requires hundreds of lines of much more complex scripting, more complex to both write and maintain.

In addition to defining view entities in XML you can also define them in database records using DbViewEntity and related entities. This is especially useful for building screens where the user defines a view on the fly (like the EditDbView.xml screen in the tools component, get to it in the menu with Tool => Data View), and then searches, views, and exports the data using a screen based on the user-defined view (like the ViewDbView.xml screen).

There aren’t quite as many options when defining a DB view entity, but the main features are there and the same patterns apply. There is a view entity with a name (dbViewEntityName), package (packageName), and whether to cache results. It also has member entities (DbViewEntityMember), key maps to specify how the members join together (DbViewEntityKeyMap), and field aliases (DbViewEntityAlias). Here is an example, from the example component:

As you can see the entity and field names correlate with the XML element and attribute names. To use these entities just refer to them by name just like any other entity.

Even with the automatic view entity minimize that the Entity Facade does during a find there are still cases where you’ll need or want to build a view programmatically on the fly instead of having a statically defined view entity.

To do this get an instance of the EntityDynamicView interface using the EntityFind.makeEntityDynamicView() method. This interface has methods on it that do the same things as the XML elements in a static view entity. Add member entities using the addMemberEntity(String entityAlias, String entityName, String joinFromAlias, Boolean joinOptional, Map<String, String> entityKeyMaps) method.

One convenient option that doesn’t exist for static (XML defined) view entities is to join in a member entity based on a relationship definition. To do this use the addRelationshipMember(String entityAlias, String joinFromAlias, String relationshipName, Boolean joinOptional) method.

To alias fields use the addAlias(String entityAlias, String name, String field, String function) method, the shortcut variation of it addAlias(String entityAlias, String name), or the addAliasAll(String entityAlias, String prefix) method.

You can optionally specify a name for the dynamic view with the setEntityName() method, but usually this mostly useful for debugging and the default name (DynamicView) is usually just fine.

Once this is done just specify conditions and doing the find operation as normal on the EntityFind object that you used to create the* EntityDynamicView* object.

**Examples:**

Example 1 (unknown):
```unknown
ec.entity.makeValue("Example").setAll(fields).setSequencedIdPrimary().create()
```

Example 2 (unknown):
```unknown
ec.entity.makeValue("Example").setAll(fields).setSequencedIdPrimary().create()
```

Example 3 (unknown):
```unknown
ec.service.sync().name("create#Example").parameters(fields).call()
```

Example 4 (unknown):
```unknown
ec.service.sync().name("create#Example").parameters(fields).call()
```

---

## Moqui Framework

**URL:** https://www.moqui.org/framework.html

**Contents:**
- MoquiFramework
    - DownloadNow
    - DownloadMoqui
    - Efficient
    - Comprehensive
    - Secure
    - Scalable
    - Modular
    - Ecosystem
    - Moqui Framework

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

Latest: Framework 3.0.0, Hazelcast 1.1.3, AWS 1.1.0,

Simple. Reusable by design. Easy to read and write. Minimally error prone. Small. Get started immediately.

Relational & document data. Local & web services. Screens & forms. Search & analytics. Printing. Caching. L10n. Integration. More.

Flexible authc and authz. Usage audit and velocity limits. Web safe (XSS, CSRF, injection, etc).

Small instances (container or VM) with as little as 1GB RAM. Large clusters with dozens of nodes for millions of concurrent users.

Minimal core framework (~25MB). Extendable with tool components. Interfaces and configuration options to add tools or override default functionality.

More than just tools. Thousands of reusable business artifacts in modular components. Get your enterprise application projects on track from day one.

For more detail see Introduction: What is Moqui Framework? and other sections below.

Default runtime with browser libraries, nav bar, XML Screen macros, and system and tools apps

Example entities, services, and screens with tests

Endpoint for service level integration

Endpoint for service level integration

Generate PDF, PS, SVG, etc from XSL-FO and HTML

Alternative to the default Bitronix transaction manager

Faceted full-text search and analytics

Clustering and distributed computing

JBoss KIE integration for Drools rules, jBPM workflow, etc

Document and graph database with Entity Facade integration

SFTP Client using SSHJ for secure integration transport

Render a wide variety of wiki formats

Moqui Framework is a seamlessly integrated, enterprise-ready framework for building enterprise automation applications based on Java. It includes tools for database interaction (relational, graph, document), logic in local and web services, web and other UI with screens and forms, security, file/resource access, scripts, templates, localization, caching, logging, searching, business rules, workflow, multi-tenancy, and integration.

WARNING: What follows is generalized marketing text. If you're a developer and want to dive in, see the links at the left. If you want warm fuzzies, you're in the right place.

Moqui helps you build applications quickly and scale complex applications to hundreds of thousands of lines of efficient, well organized code instead of millions of lines of mess. Along the way you work on only what you care about, and let the framework take care of the rest.

Is your current platform not flexible enough? Is development progressing too slowly, especially later in complex projects? Does your data lack structure? Are you finding it necessary to build things that seem really generic? Are you having issues with scalability or difficult deployment? Are your hosting options limited? Are you suffering from platform lock-in (especially with a PAAS solution)?

The Moqui Framework is an integrated tool set with everything needed to start building web-based and distributed enterprise applications right away. Rather than starting with a set of tools and figuring out how to use them together and filling in gaps that are not handled by default, Moqui is ready to go.

The framework features a well-defined Java API that makes it easy to get at the features listed below, especially in Groovy code. What's even better is that the Moqui tools are designed to be used in a declarative way so most of what you need to do will be possible with XML configuration and little or no code, unless you want code... which you can insert or override anywhere.

Comprehensive: Moqui Framework is designed to provide comprehensive infrastructure for enterprise applications and handle common things so you can focus your efforts on the business requirements, whether it be for a multi-organizational ERP system, an interactive community web site, or even a bit of simple content with a few forms thrown into the mix.

Automatic Functionality: By using the tools and practices recommended for the framework you can easily build complex applications with most security and performance concerns taken care of for you.

No Code Generation: Moqui relies on dynamic runtime functionality to avoid the need for code generation. This keeps your development artifacts small and easy to maintain, not just easy to create.

True 3-Tier Architecture: Many modern frameworks have tools for database interaction and user interaction but you have to roll your own logic layer. Moqui has a strongly defined and feature rich logic layer built around service-oriented principles. This makes it easy to build a service library for internal application use, and automatically expose services externally as needed.

The next layer up in the Moqui ecosystem is a project called Mantle that consists of a Universal Data Model, a Universal Service Library based on the data model, and a Universal Business Process Library to guide the design of it all. For more information please see the Mantle page.

For a more complete list see the Framework Features page.

When selecting an enterprise application framework there are many criteria to consider. These criteria drove the design of Moqui:

Your mother probably encouraged you to maintain a policy of: "A place for everything, and everything in its place." For enterprise frameworks best practices involve identifying common development needs and having a tool planned for each (or sometimes a primary and secondary best practice). Some needs to consider include:

The main point here is consistency. There is an efficiency aspect to this, but more on that later. This becomes more important as teams and projects get larger, and where teams are distributed or too large to interact closely and have common review of the artifacts produced. Without these guidelines developers spend a lot of time researching possible tools, learning about tools others have used, and dealing with differences in tools when working on requirements that across a large application.

In some cases the choice for a "primary" best practice tool handle most cases really well, but doesn't handle certain things very well (or at all). In those cases a "secondary" best practice tool should also be specified along with reasons when it should be used.

A small set of tools provides various benefits both during initial development, and to an even greater extent, in ongoing maintenance and improvements:

Individual developers may not be familiar with the set of tools chosen, and they may prefer the tools they are already familiar with (sometimes with strong bias). Some set of tools has to be chosen or you end up with the opposite of the benefits above. In the long run, and often short-term as well, a smaller tool set is better for both individuals and organizations.

This is #3 for a reason. If the overall tool set and practices are not adequate the benefits from efficient tools will be lost in the noise and overrun by the problems caused by other things. Efficient development tools result in development artifacts that are (in order of importance):

Some tools are great for small and simple applications, but the size and complexity of artifacts scale poorly, resulting in applications that are unnecessarily large and complex.

What existing artifacts (code, etc) do you have that you plan to continue using? Which tools were are those artifacts based on? The existing artifacts may include custom developed or packaged software, and may be currently in use or planned to be introduced as part of the project.

This is a lower priority because rewriting existing artifacts in a consistent way might not be better for initial development, but is definitely better for ongoing customization, extension, and maintenance. While this may seem expensive and difficult, there are various factors that make it easier than writing the original code:

As projects and teams get larger and go on longer a comprehensive and well organized set of tools can make the difference between costs growing exponentially and smooth sailing with minimal surprises as new requirements arise or changes are needed.

The Moqui Framework is based on a decade of experience designing the tools of the Apache OFBiz Framework using real-world business application requirements, and actually using those tools to build a system with a set of artifacts that have been reused and built on to create thousands of custom systems and dozens of open source and commercial derivative works. All of this was driven by people who do customization for a living, so tools that facilitate customization were a high priority.

So why Moqui? As OFBiz and the community around it grew in size it became more difficult to make dramatic changes to the framework and tools used in the project. Ideas kept coming about ways to improve things, organize artifacts better, use convention over configuration, get rid of redundant and unused tools, and generally make things more consistent. The Moqui Framework is the result of all of these experiences and ideas, combined into innovative and fresh ways to build the best applications in the shortest time and with the easiest to maintain artifacts.

These tools are now all combined into the Moqui XML Screens.

There are no explicit menus and instead there are subscreens and a menu is automatically generated from the set of subscreens in a screen.

Instead of using the decoration pattern the XML Screens use subscreens to compose an hierarchy of screens. The subscreens for a screen can be configured in three different ways for different purposes including: a directory structure plus defaults for a normal screen/subscreens hierarchy, an XML element to include screens from other applications or that aren't in any application, and a database table that allows add-on component to add a subscreen to an existing screen somewhere else.

It is not an option to have multiple XML Screens in a single file. Each file represents a single screen to make it easier to see what an application looks like just by browsing the directory structure, kind of like it is for webapps with normal templates and such.

Forms and trees are kept in separate files and are simply in-lined in a screen. It is possible to refer to forms externally using the screen's file location and the name of the form.

The widgets don't have any style attributes that will be used for HTML class attributes. There are id attributes in various places, but the intent is to use automatic id and class elements based on names and types of elements in the XML Screens and then keep all of the styling in an external CSS file.

There aren't any AJAX- and HTML-specific elements and attributes. This goes back to the original intent of the OFBiz widgets and that is to be purely declarative and platform independent. Many XML Screens elements will be implemented using AJAX and DHTML, and options to control those or add to them will be available.

All operations from these various places are combined in one XSD file and are referred to as XML Actions. These are included in various places using the "actions" and "condition" elements. With this approach there is no inconsistency for similarly named and designed operations or conditions.

Moqui XML Actions don't have operations that are not frequently used and some operations are like a combination of various simple-method operations. There are operations for a few additional things as well, like producing and consuming XML.

Some operations that are inconsistent in different places in OFBiz, like calling a service, have all similar features combined into one far more useful operation.

There is no performFind service needed in Moqui as the entity-find operation has an element that takes its place, and can be combined with various other elements of a find by condition for a great deal of flexibility that is easily usable.

The actions are available in many more places including ECA rules, screen transitions (like the OFBiz controller request events), and others.

The OFBiz Service Engine is most like the Service Facade in Moqui. There are many other facades, and for more info see the API Structure section below.

Service names are split into verb and noun parts, which together make up the service name (ie like: ${verb}${noun}). Services are called with the combined name and can separate the verb and noun parts of it using a hash mark ('#'). Services are also organized by path just like Java classes to facilitate lazy loading and to better organize code. The full name of a service will follow a pattern like: "${path}.${verb}${noun}".

Service parameters in Moqui are like the service attributes in OFBiz.

Service parameters are split into two groups: "in-parameters" and "out-parameters" so that parameters with the same name can have different settings going into or coming out of the service.

Parameters in Moqui have hierarchical sub-types for map and collection types.

Parameters have a fairly complete set of validation tags. Those validation tags will be used for server-side validation when the service is called, AND when the service is a target on a screen transition it will be used to generate client-side validation in JavaScript. This validation is defined once but run in both places.

As mentioned above XML Actions are available in many places, and one of those places is inside a service definition. With this a service implementation can be inline inside the service definition or external depending on preference.

The OFBiz Entity Engine is most like the Entity Facade in Moqui. There are many other facades, and for more info see the API Structure section below.

Entity definitions are more streamlined and don't have the less useful attributes and elements. Primary key fields are designated with an attribute on the field element instead of using a separate element. The data type dictionary in Moqui is more simple and better organized than in OFBiz and the data types available are declared in the XSD for auto-completion help.

The API for dealing with entity values and for queries and such is much more simple, streamlined, and in a few small cases has additional functionality. The methods have far more consistent names than in OFBiz, using create/update/delete everywhere instead of things like store or remove.

Moqui does not have a concept of multiple delegators so the Entity Proxy configuration file is much more simple. The datasource elements are also far more simple because all of the database-specific settings are now in the database configuration file along with the data type dictionary (combined in one file instead of a separate file for each database).

The Moqui API is clearly separate into interfaces and implementations of those interfaces. Applications only need to worry about the interfaces part of the Java code and not the underlying implementation.

All tools in the Moqui framework are available through the ExecutionContext object, which is created and attached to a thread for each web request, remotely called service, etc. It keeps the current context for whatever is running and has a series of facades for each tool in the framework, including for sevices, entities, screens, localization, logging, caching, user info and preferences, and so on. Some of the implementations of these interfaces will be reusable from one thread to another, and others will be created for each thread.

The API is designed to take advantage of some of the syntax short cuts in Groovy such as using the dot syntax to start with the Moqui static object and get down to whatever part of the API you need.

In Moqui the framework is one big happy set of tools that work together. There is no attempt to separate the tools or make them useful on their own. That was goal at first with OFBiz, but never really worked out very well and splitting the framework into components caused more difficulty than it helped things. So, in Moqui it's all one big framework, and one that can be easily compiled and deployed and so on. The basic idea is that the framework jar files (api and implementation) on the classpath plus the locaiton of the runtime directory are all you need to get started. Components can be loaded through an API or configuration.

Configuration files are meant to come from a runtime directory and are not spread around the code. There is a default-conf directory in the framework so that if a configuration file is left out the framework will have a default to fallback on that will work in most cases.

While Moqui supports multiple webapps, the normal deployment mode is be as a single big webapp with screen trees from add on components mounted on a certain path within the big webapp.

Instead of a set of entities and services for content management that are part of the project Moqui uses the JCR 2.0 interfaces (and by default the Apache Jackrabbit implementation) for content management. Anywhere there is a "location" in the API or XML files it can have a prefix of "content://" to access something from the JCR. This means that code and templates and such can go there as well.

Moqui uses a set of entities to define user groups, artifact groups, and permissions for a group of users on a group of artifacts. These are external settings and support record level permissions too. With this approach there is no need make the artifacts responsible for permission checking, and no code changes are required to change permissions when customizing or maintaining or supporting an application.

There is a tarpit, like the idea in OFBiz, that uses the same model as the permissions for reduced redundancy and more features.

Internationalization is implicit everywhere in Moqui using natural text in the default language for a key instead of an artificial identifier. This reduces redundancy and effort. The localized labels are in a database table instead of an XML file to perform better (only lookup and cache labels that are used) and to support per-instance localizations in a multi-instance environment.

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/The+Tools+Application/Data+View

**Contents:**
      - Wiki Spaces
      - Page Tree
- Data View
  - Find DB View
  - Edit DB View
  - View DB View

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

The data view screens are used to define a simple view entity stored in the database (using the DbViewEntity and related entities) and then view the results and export them as a CSV file. These screens are a simple form of ad-hoc report and data export that leverage the concept of master and dependent entities and allow for easy aliasing of fields on a master entity and all directly related dependents with an optional function. More elaborate DB view entities can be defined and viewed/exported from these screens, but the Edit DB View screen only supports a master entity and the entities directly related to it.

The find screen has a form at the top to create a DbViewEntity and then table with all existing DB view entities and links to Edit or View them.

The screen to edit a DB view entity has a form at the top to change the package the entity is in. Note that view entities defined in DbViewEntity can be used in the Entity Facade just like any other entity or view entity.

Next on the screen is a form to set the master entity, or the main entity in the view that all other entities will be related to. Once this is set the list form below shows all of the fields on that entity and directly related entities. In this screenshot below the master entity is the Example entity and the fields shown are for it and the ExampleType Enumeration, and Example StatusItem. The screen is cut off partway down and if you view the full screen you’ll also see fields further down for the ExampleContent, ExampleFeatureAppl, and ExampleItem entities (which all have a cardinality of many).

The fields selected to include in the view are the Enumeration.description and StatusItem.description fields, the exampleId and exampleName from the Example entity (the master entity), and further off screen the ExampleItem.exampleItemSeqId field is selected with a count function to get a count of items on the example.

This screen displays the results of querying the defined DB view entity, paginated if needed, and with a Filter button that pops up a form with filter options for the fields on the view entity (using the default auto fields in a form-single). There is a link to go back to the Edit DB View screen, and a link to get the results in a CSV file.

Here is a sample of the CSV export from the same ExampleDbView results as the screenshot:

**Examples:**

Example 1 (unknown):
```unknown
Description,Description2,Example ID,Example Item Seq ID,Example Name
Made Up,In Design,TEST2,1,Test Example Name 2
Made Up,In Design,TEST1,2,Test Example Name
```

Example 2 (unknown):
```unknown
Description,Description2,Example ID,Example Item Seq ID,Example Name
Made Up,In Design,TEST2,1,Test Example Name 2
Made Up,In Design,TEST1,2,Test Example Name
```

---

## Moqui Documentation

**URL:** https://www.moqui.org/m/docs/framework/Logic+and+Services/Service+ECA+Rules

**Contents:**
      - Wiki Spaces
      - Page Tree
- Service ECA Rules

Try the applications demo! Try POP Shop eCommerce!

Comments? Questions? Get Involved? Join the Forum

An ECA (event-condition-action) rule is a specialized type of rule to conditionally run actions based on events. For Service ECA (SECA) rules the events are the various phases of executing a service, and these are triggered for all service calls.

Service ECAs are meant for triggering business processes and for extending the functionality of existing services that you don't want to, or can't, modify. Service ECAs should NOT generally be used for maintenance of data derived from other entities, Entity ECA rules are a much better tool for that.

Here is an example of an SECA rule from the AccountingInvoice.secas.xml file in Mantle Business Artifacts that calls a service to create invoices for orders when a shipment is packed:

The required attributes on the seca element are service with the service name, and when which is the phase within the service call. These two attributes together make up the event that triggers the SECA rule. There is also a run-on-error attribute which defaults to false and if set to true the SECA rule will be triggered even if there is an error in the service call.

The options for the when attribute include:

When the actions run the context will be whatever context the service was run in, plus the input parameters of the service for convenience in using them. If when is before the service itself is run there will be a context field called parameters with the input parameters Map in it that you can modify as needed in the ECA actions. If when is after the service itself the parameters field will contain the input parameters and a results field will contain the output parameters (results) that also may be modified.

The condition element is the same condition as used in XML Actions and may contain expression and compare elements, combined as needed with or, and, and not elements.

The actions element is the same as actions elements in service definitions, screens, forms, etc. It contains a XML Actions script. See the Overview of XML Actions section for more information.

**Examples:**

Example 1 (unknown):
```unknown
<seca service="update#mantle.shipment.Shipment" when="post-service">
    <condition><expression>statusChanged &amp;&amp; statusId == 'ShipPacked' &amp;&amp; !(oldStatusId in ['ShipShipped', 'ShipDelivered'])</expression></condition>
    <actions>
        <entity-find-one entity-name="mantle.shipment.Shipment" value-field="shipment"/>
        <set field="shipmentTypeEnum" from="shipment.'ShipmentType#moqui.basic.Enumeration'"/>
        <if condition="shipmentTypeEnum?.enumId == 'ShpTpOutgoing' || shipmentTypeEnum?.parentEnumId == 'ShpTpOutgoing'">
            <service-call name="mantle.account.InvoiceServices.create#SalesShipmentInvoices" in-map="[shipmentId:shipmentId]"/>
       </if>
    </actions>
</seca>
```

Example 2 (unknown):
```unknown
<seca service="update#mantle.shipment.Shipment" when="post-service">
    <condition><expression>statusChanged &amp;&amp; statusId == 'ShipPacked' &amp;&amp; !(oldStatusId in ['ShipShipped', 'ShipDelivered'])</expression></condition>
    <actions>
        <entity-find-one entity-name="mantle.shipment.Shipment" value-field="shipment"/>
        <set field="shipmentTypeEnum" from="shipment.'ShipmentType#moqui.basic.Enumeration'"/>
        <if condition="shipmentTypeEnum?.enumId == 'ShpTpOutgoing' || shipmentTypeEnum?.parentEnumId == 'ShpTpOutgoing'">
            <service-call name="mantle.account.InvoiceServices.create#SalesShipmentInvoices" in-map="[shipmentId:shipmentId]"/>
       </if>
    </actions>
</seca>
```

---
