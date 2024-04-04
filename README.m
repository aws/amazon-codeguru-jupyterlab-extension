## Amazon CodeGuru JupyterLab Extension

Amazon CodeGuru extension for [JupyterLab](https://jupyterlab.readthedocs.io/en/stable/) and [SageMaker Studio](https://aws.amazon.com/sagemaker/studio/).
This extension runs scans on your notebook files and provides security recommendations and quality improvements to your code.

## Requirements

- JupyterLab >= 3.0

## Install

```sh
pip install amazon_codeguru_jupyterlab_extension
```

## Uninstall

```sh
pip uninstall amazon_codeguru_jupyterlab_extension
```

## Development

### Prerequisites

Ensure the following dependencies are available in your environment.

- Python >= 3.8
- JupyterLab >= 3.0
- NodeJS >= 18

Alternatively, you can create a conda virtual environment with the following commands:

```sh
conda env update --file binder/environment.yml
conda activate amazon-codeguru-extension-demo
```

### Manual Setup

1. Install the Python package in development mode.

```sh
pip install -e .
```

2. Link the extension with JupyterLab.

```sh
jupyter labextension develop . --overwrite
```

3. Build the Typescript source.

```sh
jlpm build
# or
jlpm watch # automatically rebuild changes
```

4. Start the JupyterLab server

```sh
jupyter lab
```

### Quick Setup

Run the following command to quickly build and install the extension.

```sh
python3 binder/postBuild
```

## Release

This extension can be distributed as a Python package.
First, install build dependencies:

```sh
pip install build twine hatch
```

Bump the version using `hatch`. By default this will create a tag.

```sh
hatch version <new-version>
```

To generate a new Python source package (`.tar.gz`) and the binary package (`.whl`) in the `dist/` directory, run the following command:

```sh
python -m build
```

Then to upload the package to PyPI, run the following command:

```sh
twine upload dist/*
```

## Security

See [SECURITY](SECURITY.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
