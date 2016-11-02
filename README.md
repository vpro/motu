# motu

## Python webserver (Flask)

Make sure you have Python 2.7 installed on your system

**Note**: You could also install Python 3.x, it's just that it hasn't been tested with that version yet. It should be quite simple to fix the code if you know Python.

Make sure to install [pip](https://pypi.python.org/pypi/pip/)

Installing [virtualenv](https://virtualenv.pypa.io/en/stable/) is also recommended

Assuming you've installed virtualenv as well. Now do the following:

```
mkdir YOUR_DIR

cd YOUR_DIR

virtualenv venv

git clone https://github.com/beeldengeluid/motu.git

```

In YOUR_DIR you should now have the following two directories:

- motu: containing the code of this repo
- venv: the Python virtual environment you preferrably install all the required Python libraries in

Now continue with installing the necessary Python libraries as follows:

```
. venv/bin/activate

cd motu

pip install -r requirements.txt
```

**Note**: If you skip the first command, you will simply install the Python libraries globally on your system

## Client libraries



