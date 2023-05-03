import ast
import json
import sys
from pprint import pprint

def ipython2python(code):
    """Transform IPython syntax to pure Python syntax
    Parameters
    ----------
    code : str
        IPython code, to be transformed to pure Python
    """
    try:
        from IPython.core.inputtransformer2 import TransformerManager
    except ImportError:
        print(
            "IPython is needed to transform IPython syntax to pure Python."
            " Install ipython with `pip install -r requirements.txt`."
        )
        return code
    else:
        isp = TransformerManager()
        return isp.transform_cell(code)
commands = ['cd', 'ls', 'pip']
def is_command(line):
  for command in commands:
    if line.lstrip().startswith(command):
      return True
  return False
def run(inp, out):
  with open(inp,'r') as red:
    notebook = json.load(red)
    cells = notebook['cells']
    notebookScript = 'def __CELL_EDGE__(x):\n\tpass\n'
    cellMetaWithEC = [] # cells with execution count
    cellMetaWoEC = [] # cells without execution count
    cellnum = 0
    for cell in cells:
      if cell['cell_type'] == 'code':
        code = cell['source']
        codeStr = ""
        for c in code:
            codeStr+=c
        cellCode = ipython2python(codeStr)
        cellCode = cellCode.rstrip(cellCode[-1])# remove the last line break
        if len(code) == 1: # handle single line command
          if is_command(code[0]):
            cellCode = 'pass #' + cellCode
        if cell['execution_count'] is None:
          cellMetaWoEC.append((cellnum, -1, cellCode))
        else:
          cellMetaWithEC.append((cellnum, cell['execution_count'], cellCode))
        cellnum += 1
    print(str(len(cellMetaWithEC)) + " cells contain execution count.")
    print(str(len(cellMetaWoEC)) + " cells were not executed.")
    if len(cellMetaWithEC)>0:
        print("convert notebook cells in execution order.")
        cellMetaWithEC = sorted(cellMetaWithEC, key=lambda x: x[1])
    else:
        print("no executed cells was detected, convert notebook cells in linear order.")
    for cm in cellMetaWithEC: # append executed code cells.
        notebookScript += '__CELL_EDGE__('+str(cm[0])+')\n'+cm[2]+'\n'
    for cm in cellMetaWoEC: # append unexecuted code cells in the end.
        notebookScript += '__CELL_EDGE__('+str(cm[0])+')\n'+cm[2]+'\n'
    output = open(out,'w')
    output.write(notebookScript)
    output.close()

def main():
  if len(sys.argv) != 3:
    print('input must have 2 arguments\n\tinput file\n\toutput file\n')
  run(sys.argv[1], sys.argv[2])
  print("conversion done!")

if __name__ == '__main__':
  main()

