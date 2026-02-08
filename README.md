# SVG to STL CLI

A command-line tool to convert [scalable vector graphics] (SVG) files into [stereo-lithography] (STL) files for 3D printing. Originally created to enable the 3D printing of plates for a [printing press] from 2D vector graphics.

## Installation

```bash
git clone git@github.com:dfosco/svg-to-stl-cli.git
cd svg-to-stl-cli
npm install
```

### Global usage (recommended)

To use `svg-stl` from anywhere on your machine, install it globally:

```bash
cd svg-to-stl-cli
npm install -g .
```

This registers the `svg-stl` command in your PATH. You can then run it from any directory:

```bash
svg-stl <input.svg> [options]
```

To uninstall the global command later:

```bash
npm uninstall -g svg-to-stl-cli
```

## CLI Usage

```bash
svg-stl <input.svg> [options]
```

Or, without global install, from the project directory:

```bash
npm run svg-stl -- <input.svg> [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <path>` | Output STL file path | Input filename with .stl extension |
| `--type-size <mm>` | Image size in mm | 60 |
| `--type-depth <mm>` | Depth of type in mm | 3 |
| `--invert-type` | Invert type | false |
| `--flare-type` | Flare type (bevel) | false |
| `--reverse-winding-order` | Reverse winding order | false |
| `--base-plate` | Enable rectangular base plate | (no base plate) |
| `--base-plate-circle` | Enable circular base plate | (no base plate) |
| `--base-depth <mm>` | Depth of base in mm | 5 |
| `--buffer <mm>` | Buffer around the image in mm | 5 |
| `--color <hex>` | Color for rendering (hex format) | #5d9dea |

### Examples

Basic conversion:
```bash
svg-stl example-svg/Entypo/star.svg
```

With custom output and size:
```bash
svg-stl example-svg/Entypo/star.svg -o star_large.stl --type-size 100
```

With rectangular base plate:
```bash
svg-stl example-svg/Entypo/star.svg --base-plate
```

With circular base plate:
```bash
svg-stl example-svg/Entypo/star.svg --base-plate-circle
```

There are example SVG files in [example-svg/Entypo].

### Features
  - Specifying type height
    - Including indented/recessed type
  - Rendering with and without a base plate
    - Round and Rectangular base plates supported
    - Specifying base plate height
  - Optionally inverting type for printing press use
  - Optionally flaring the base of type for added strength
  - Reversing the winding order (CW/CCW) of SVG paths for incorrectly-built SVG files

### Known Limitations
  - The base plate and type are output as separate meshes rather than using CSG (Constructive Solid Geometry) operations to merge them. For most 3D printing purposes, this is functionally equivalent, but slicers will process them separately.
  - A hole in an SVG path should be defined by points in counter-clockwise order, where the shape outline is defined by points in a clockwise order, or vice versa. Some SVG creation tools don't do this correctly, and shapes render in 3D space as "inside out".
    - You can try the `--reverse-winding-order` option to fix this, but it's possible to have both combinations of winding in the same file, ensuring that some part is always inside out.
  - A hole that is not a hole, but an additional shape filled with background color will not render as a hole.
  - SVG text elements are not supported. To render text, you need to convert the text to "outlines" or "paths" before saving the SVG file.


### Supported Platforms

For now tested on MacOS, but if you try on Linux or Windows WSL and something breaks, open an issue!

### Dependencies
* [three.js] - For 3D geometry creation and rendering
* [jsdom] - For SVG parsing in Node.js environment
* [commander] - For CLI argument parsing

   [printing press]: <https://en.wikipedia.org/wiki/Printing_press>
   [scalable vector graphics]: <https://en.wikipedia.org/wiki/Scalable_Vector_Graphics>
   [stereo-lithography]: <https://en.wikipedia.org/wiki/STL_(file_format)>
   [example-svg/Entypo]: </example-svg/Entypo>
   [three.js]: <https://github.com/mrdoob/three.js>
   [jsdom]: <https://github.com/jsdom/jsdom>
   [commander]: <https://github.com/tj/commander.js>

### Acknoledgments

Props to @rcalme who open sourced https://github.com/rcalme/svg-to-stl eleven years ago and made creating this CLI a breeze 🙇‍♂️