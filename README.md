
## <img src="img/marquee.png" alt="`ili" width="1400"/>

`ili is a visualization app for 3D molecular cartography. For more information about the molecular cartography, please see our recent protocol paper [*Protsyuk et al. (2017) Nature Protocols*](https://www.nature.com/articles/nprot.2017.122).

`ili is being developed mainly by [Alexandrov Team](http://www.embl.de/research/units/scb/alexandrov/index.html) at EMBL Heidelberg ([contact information](http://www.embl.de/research/units/scb/alexandrov/contact/index.html)) in collaboration with the [Dorrestein Lab](http://dorresteinlab.ucsd.edu/Dorrestein_Lab/Welcome.html) and the [Knight Lab](https://knightlab.ucsd.edu/) at UCSD.

* Developers: Ivan Protsyuk, Sergey Ryazanov, Richard Goater
* External contributors:
  * Members of [Knight lab](http://knightlab.ucsd.edu): Antonio Gonzalez, Jamie Morton, Jose Navas, Yoshiki Vázquez Baeza
  * Members of [Atomicus](https://atomicus.de/): Alexei Dolgolyov, Konstantin Senkevich, Violetta Nebyshinets
* Principal investigator: Theodore Alexandrov 

### Table of contents

* [Hello bee](#hello-bee)
* [Examples from real-life studies](#examples-from-real-life-studies)
* [Installation](#installation)
* [Input](#input)
* [How to use it?](#how-to-use-it)
* [Demo](#demo)
* [3D models with texture](#3d-models-with-texture)
* [Cartographical snapshots](#cartographical-snapshots)
* [Permanent links to \`ili visualization](#permanent-links-to-ili-visualization)
* [Any questions?](#any-questions)
* [How to stay updated](#how-to-stay-updated)
* [Miscellaneous](#miscellaneous)
* [License](#license)
* [Funding](#funding)

## Hello bee

For a demonstration, open
* [3D human skin metabolome example](https://goo.gl/aMBzq8) from *[Bouslimani et al., PNAS, 2015](#miscellaneous)*; zoom out by using the mouse wheel to see the full image and follow [instructions](#how-to-use-it)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src="img/screenshot_human.png" alt="Screenshot of the human example" width="500"/>

* [3D bee example](https://goo.gl/YyB3Te) (data provided by Yi Zeng from the Dorrestein Lab, UCSD)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src="img/screenshot_bee.png" alt="Screenshot of the bee example" width="500"/>

* [2D cyanobacteria distribution example](https://goo.gl/6CGCCK) (data provided by Tal Luzzatto from the Dorrestein Lab, UCSD); zoom out by using the mouse wheel to see the full image and follow [instructions](#how-to-use-it)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src="img/screenshot_cyano.png" alt="Screenshot of the 3dmassomics example" width="500"/>

## Examples from real-life studies

On [this page](./Studies.md) you can find examples of \`ili being applied in research.

## Installation

The best ways of running \`ili are either [from this website](http://ili.embl.de/) or as a [Chrome extension](https://goo.gl/3KAA8U).

## Input

\`ili takes two files:
* for 2D mapping: a PNG or JPG file to be used as the background image ([example](https://raw.githubusercontent.com/MolecularCartography/ili_file_server/master/data/cyano/bg.png)), and a mapping file with intensities and coordinates in CSV format ([example](https://raw.githubusercontent.com/MolecularCartography/ili_file_server/master/data/cyano/intensities.csv))
* for 3D mapping: a 3D model in STL format ([example](https://raw.githubusercontent.com/MolecularCartography/ili_file_server/master/data/bee/model.stl)), and a mapping file with intensities and coordinates in CSV format ([example](https://raw.githubusercontent.com/MolecularCartography/ili_file_server/master/data/bee/intensities.csv))

To create a mapping file suitable for input, you need two pieces of information: coordinates of your samples on your picture/model and intensities of features you're going to visualize in \`ili. Please find the instruction on how to create a CSV table with coordinates [here](https://github.com/alexandrovteam/Optimus/blob/master/Obtaining%20coordinates%20of%20sampling%20spots.md). Rows of the result table correspond to samples. Once you have it, you can add your features as new columns. Finally, you need to save it as a CSV file, and it is ready to be viewed in \`ili. Refer to the examples above to have an idea of the final look of the table.

## How to use it?

One of the fundamental ideas behind the \`ili interface is the simplicity of usage. Therefore, most operations can be performed with keyboard shortcuts.

|Action|Shortcut on Windows, Linux|Shortcut on OS X|Alternative|
|------|--------------------------|----------------|-----------|
|Open files|<kbd>Ctrl</kbd>+<kbd>O</kbd>|<kbd>⌘</kbd>+<kbd>O</kbd>|Drag and drop files to \`ili window. Also, when you just launched \`ili, you can press `Open` button at the center of the window.|
|Switch between molecular maps|<kbd>Ctrl</kbd>+<kbd>↑</kbd>, <kbd>Ctrl</kbd>+<kbd>↓</kbd>|<kbd>⌘</kbd>+<kbd>↑</kbd> , <kbd>⌘</kbd>+<kbd>↓</kbd>|Click on a name of an active map above a colorbar at the right-bottom corner of an app window and select another map with mouse.|
|Find a molecular map by its name|<kbd>Ctrl</kbd>+<kbd>F</kbd>|<kbd>⌘</kbd>+<kbd>F</kbd>|Click on a name of an active map above a colorbar at the right-bottom corner of an app window and start typing.|
|Save view as image|<kbd>Ctrl</kbd>+<kbd>S</kbd>|<kbd>⌘</kbd>+<kbd>S</kbd>|NA
|Save cartographical snapshot|<kbd>Ctrl</kbd>+<kbd>E</kbd>|<kbd>⌘</kbd>+<kbd>E</kbd>|NA

Many other controls for adjusting visualization are available in the \`ili sidebar. Three main sections there "2D", "3D" and "Mapping" correspond to settings affecting 2D/3D views and colormaps.

Mouse buttons can be used to adjust point of view on a model/picture.

|Action|Mouse button|Views where available|
|------|------------|---------------------|
|Rotate model|Move mouse holding its left button|3D|
|Move image|Move mouse holding its left button|2D|
|Zoom|Rotate mouse wheel|2D, 3D|
|Display spot name|Click at a spot with left button|2D, 3D|
|Move model|Move mouse holding its right button|3D|
|Enable/disable model auto-rotation|Double-click|3D|

## Demo

You can find a list of ready-made examples in the "Examples" tab in the \`ili sidebar. Click on any of them, and necessary files will be loaded to the app automatically.

## 3D models with texture

In addition to plain models in STL format, \`ili also supports 3D models in [OBJ format](https://en.wikipedia.org/wiki/Wavefront_.obj_file), which can be visualized with textures on top of them. As a prerequisite for that, textures must be saved as images in PNG or JPG format associated with a material definition file in [MTL format](https://en.wikipedia.org/wiki/Wavefront_.obj_file#Material_template_library). Thus, at least three files are needed to visualize a 3D model with texture in \`ili: model in OBJ format, material definition file and a texture image. All these file types are compatible with other input files, e.g. mapping files or cartographical snapshots, and can be opened in \`ili using regular actions, like drag&drop.

One can find a 3D model of a coral and texture for it [here](https://github.com/MolecularCartography/ili_file_server/tree/master/data/coral_textured) (courtesy of John Burns, University of Hawaii) as an example of appropriate input files for \`ili.

## Cartographical snapshots

\`ili facilitates reproducible data analysis by providing the feature of cartographical snapshots: a complete copy of all visualization settings saved to a file. The file can be reused later or shared with other users, who, afterwards, will be able not only to recover the same view, but also use it as a starting point for further analysis.

The cartographical snapshot is a file in JSON format that can be opened in \`ili using drag&drop along with corresponding files of 3D model/image and spatial mapping.

## Permanent links to \`ili visualization

It is possible to create permanent web-links to \`ili visualizations, which can be shared with other people or included into publications, without explicit sharing of the input files. In order to do that, one needs to deposit all necessary input files (model/picture, mapping file and cartographical snapshot(s)) to a public data repository, which can be one of recognized resources in a specific field (e.g. [MassIVE](https://massive.ucsd.edu/ProteoSAFe/static/massive.jsp), [MetaboLights](https://www.ebi.ac.uk/metabolights/), etc) or an ordinary FTP server. The only requirement to the storage is it should allow downloading files without any authorization. After all the files are uploaded to the storage, a permanent link to \`ili visualization can be composed by chaining all links to the files into a single URL, which starts with the \`ili address (https://ili.embl.de) followed by question mark and all file links separated by semicolon. Example: https://ili.embl.de/?ftp://massive.ucsd.edu/MSV000081081/updates/2017-05-15_mernst_9ac10437/peak/EHorrida_20160915_Model3_withroots.stl;ftp://massive.ucsd.edu/MSV000081081/updates/2017-05-15_mernst_9ac10437/peak/EHorrida_Model3_features.csv . The order of the files does not matter. Links to visualization of different features in the same dataset or different visualization settings can be created by using different cartographical snapshot files. More examples can be found in [the list of studies](./Studies.md), where \`ili was used.

## Any questions?

Feel free to leave your questions and suggestions as issues in this repository or at the ["Support" section](https://goo.gl/D8DH53) on the \`ili page at Google web store.

## How to stay updated

Please sign up to the mailing list by sending an email to ili-toolbox+subscribe@googlegroups.com

## Miscellaneous

* **Why is it called \`ili?** \`ili in Hawaiian means skin and, among others, surface, area, or cover.
* **How to record videos or screencasts in \`ili?** Please use a third-party software, for example ScreenCastify plugin to Chrome
* **How can I cite \`ili in my scientific publication?** Please cite [*Protsyuk et al. (2017) Nature Protocols*](https://www.nature.com/articles/nprot.2017.122).

## License

The content of this project is licensed under the Apache 2.0 licence, see the [license file](https://github.com/MolecularCartography/ili/blob/master/LICENSE.md).

## Funding

This project is funded from the European projects [3D-MASSOMICS](http://3d-massomics.eu/) (FP7 HEALTH program, grant agreement no. 305259), [METASPACE](http://metaspace2020.eu/) (Horizon2020 program, grant agreement no. 634402) and from the internal funds of the European Molecular Biology Laboratory.
