# Rufio

![image](https://raw.githubusercontent.com/wesleytodd/rufio/master/assets/rufio.jpg)

Rufio is a extensible and modular content management system for node apps.  It aims to be a set of low level tools to build on top of, so it provides some data structures like `Site`, `Type` (think "posts" or "pages") and `Item` (ex. a single post).  One of the core concepts Rufio is built on top of are node streams.  Almost all operations to transform or compose your content is done through streams.  This helps make large collections of content performant and helps keep a lower memory footprint.

There are three main design goals for Rufio to help it be the right tool for you:

1. *Modularity* - All components are available as stand alone modules that you can pull in depending on your needs and application.  If you are interested in a more comprehensive framework you can check out TBD
2. *Extensible* - All of the core components can be extended via inheritance, composition or the plugin api.  There is also a deep integration for transform streams which provide hooks into the build pipeline for your content.
3. *Simplicity* - The base api's are designed to provide the smallest footprint possible to achieve the goals of the project.  All other functionality is built into modules you can compose together to provide more complicated functionality.


## The Base Components

- `Item`: An items is the smallest representation of a chunk of content.
- `File`: A file is a special type of item, it represents a single resource that lives on the file disk.  It has things like a filename and path.
- `Collection`: A collection is a group of items.  These can be used to group and index sets of items.
- `Type`: A type is a special collection.  Often a type will correspond with directory of content items which share functionality.
- `Site`: A site is a higher level concept to group given items and types.  It maps directly to the needs of a website to display your content.

## Streams

Streams are a big part of Rufio.  Most of the actual work is done through streams:

- Loading content for items
- Transforming item content

