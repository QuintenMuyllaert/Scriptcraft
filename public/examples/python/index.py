import json
import sys

script = sys.argv.pop(0) 
scargs = json.loads(sys.argv.pop(0))

def sc(cmd):
    obj = {"sc":cmd}
    print(json.dumps(obj))


def main(arg = "World"):
    player = scargs["player"]
    # Start code.
    sc(f"tellraw {player} \"Hello {arg}!\"")
    sc(f"execute at {player} run setblock ~ ~ ~ diamond_block")
    # Stop code.
    
main(*sys.argv)