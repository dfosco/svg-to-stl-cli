#!/usr/bin/env node
import { program } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { convertSvgToStl } from '../src/index.js';

program
  .name('svg-stl')
  .description('Convert SVG files to STL for 3D printing')
  .version('1.0.0')
  .argument('<input>', 'Input SVG file path')
  .option('-o, --output <path>', 'Output STL file path (defaults to input name with .stl extension)')
  .option('--type-size <mm>', 'Image size in mm', '60')
  .option('--type-depth <mm>', 'Depth of type in mm', '3')
  .option('--invert-type', 'Invert type', false)
  .option('--flare-type', 'Flare type (bevel)', false)
  .option('--reverse-winding-order', 'Reverse winding order', false)
  .option('--base-plate', 'Enable rectangular base plate')
  .option('--base-plate-circle', 'Enable circular base plate')
  .option('--base-depth <mm>', 'Depth of base in mm', '5')
  .option('--buffer <mm>', 'Buffer in mm', '5')
  .option('--color <hex>', 'Color for rendering (hex format)', '#5d9dea')
  .action((input, options) => {
    try {
      // Read SVG file
      const svgContent = readFileSync(input, 'utf-8');
      
      // Determine output file path
      const outputPath = options.output || input.replace(/\.svg$/i, '.stl');
      
      // Build options object matching original HTML form defaults
      const wantBasePlate = options.basePlate || options.basePlateCircle || false;
      const basePlateShape = options.basePlateCircle ? 'Circular' : 'Rectangular';

      const conversionOptions = {
        typeSize: Math.abs(Number(options.typeSize)),
        typeDepth: Number(options.typeDepth),
        wantInvertedType: options.invertType,
        bevelEnabled: options.flareType,
        svgWindingIsCW: options.reverseWindingOrder,
        wantBasePlate,
        basePlateShape,
        baseDepth: Math.abs(Number(options.baseDepth)),
        baseBuffer: Math.abs(Number(options.buffer)),
        objectColor: options.color
      };
      
      // Convert SVG to STL
      const stlContent = convertSvgToStl(svgContent, conversionOptions);
      
      // Write STL file
      writeFileSync(outputPath, stlContent);
      
      console.log(`Successfully converted ${input} to ${outputPath}`);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();
