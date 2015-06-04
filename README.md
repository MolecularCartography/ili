
## <img src="img/logo_128.png" alt="`ili" width="128"/>

`ili is a toolbox for 2D and 3D molecular mapping in Chrome.

`ili is being developed by [Alexandrov Team](http://www.embl.de/research/units/scb/alexandrov/index.html) at EMBL Heidelberg.

* Developer: Sergey Ryazanov
* Principal investigator: Theodore Alexandrov


## Hello bee

For a demonstration, open in Google Chrome 
* [3D human skin metabolome example](http://ili-toolbox.github.io/?human/man.stl;human/man_LCMS_small.csv) from [the PNAS paper](#miscellaneous); zoom out by using the mosue wheel to see the full image and follow [instructions](#what-is-ili-for)
* [3D bee example](http://ili-toolbox.github.io/?bee/model.stl;bee/intensities.csv) (data provided by Yi Zeng from the Dorrestein Lab, UCSD); follow [instructions](#what-is-ili-for)
* [2D 3dmassomics visualisation example](http://ili-toolbox.github.io/?3dmassomics/bg.png;3dmassomics/intensities.csv) (a photo made during the 3D-MASSOMICS project meeting with simulated spots overlaid); zoom out by using the mosue wheel to see the full image and follow [instructions](#what-is-ili-for)


## Installation

There are 3 ways of running `ili in Chrome: [from this website](http://ili-toolbox.github.io/), using your http server, or as a Chrome App.

## Input

`ili takes two files: 
* for 2D mapping: a PNG to be used as the background image ([example](https://raw.githubusercontent.com/ili-toolbox/ili/master/data/3dmassomics/bg.png)), and a CSV with intensities and coordinates ([example](https://raw.githubusercontent.com/ili-toolbox/ili/master/data/3dmassomics/intensities.csv))
* for 3D mapping: a binary STL of the 3D model ([example](https://raw.githubusercontent.com/ili-toolbox/ili/master/data/bee/model.stl)), and a CSV with intensities and coordinates ([example](https://raw.githubusercontent.com/ili-toolbox/ili/master/data/bee/intensities.csv))

## What is `ili for?

Among other things, `ili can be used for 
* showing molecular maps (Ctrl-up or -down in Win/Lin; Cmd-up or Cmd-down in Mac)
* searching for a molecular map by a name substring (Ctrl-f)
* adjusting visualizaiton of a map including colors, scaling, hotspot removal using quantile thresholding
* interactive visualization in 2D using mouse (zoom by wheeling, zoom into particular region by click-and-wheeling)
* interactive visualization in 3D using mouse (rotate by dragging, zoom by wheeling)
* showing the name of a spot by clicking at it
* saving the rendering as PNG by Ctrl-s (in Win/Lin) or Cmd-s (in Mac)


## How to stay updated

Please sign up to the mailing list by sending an email to ili-toolbox+subscribe@googlegroups.com


## Miscellaneous

* **Why is it called `ili?** `ili in Hawaiian means skin and, among others, surface, area, or cover.
* **How to record videos or screencasts in `ili?** Please use a third-party software, for example ScreenCastify plugin to Chrome
* **How can I cite `ili in my scientific publication?** We haven't published a paper devoted to \`ili yet, so please cite [*Bouslimani et al. (2015) PNAS*](http://www.pnas.org/content/112/17/E2120.abstract?sid=3ff11025-6bea-4b97-808e-0b4d49b7f837), our publication which motivated us the create and release \`ili.



## Funding

This project is funded from the European Union project [3D-MASSOMICS](http://3d-massomics.eu/) (FP7 HEALTH program, grant agreement no. 305259).




