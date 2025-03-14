## Resources external to published modules and packages

Contents of this directory may include:

### Training files

/bin/training-files.ts is a script that can be used to generate training files in this directory.

Training files are generated from the source code of the SDK and are intended for use in fine-tuning large language models.

To generate training files, run:
```bash
npx ts-node bin/training-files.ts
```

The training files will be generated in the `resources` directory.