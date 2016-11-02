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


Now you're almost ready to start the server, the only thing to do is make sure to create a settings file:

```
cd YOUR_DIR/motu/src

cp settings-example.py settings.py
```

Now you can test the server by running:

```
python server.py
```

**Note**:

You can change the port and host of the server in settings.py

To make the search functionalities of the app work, please contact me to give you a valid URL to fill in for the SEARCH_API parameter in the settings file.


## Client libraries



