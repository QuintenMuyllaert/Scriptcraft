#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char* concat(const char *s1, const char *s2)
{
    char *result = malloc(strlen(s1) + strlen(s2) + 1);
    strcpy(result, s1);
    strcat(result, s2);
    return result;
}

void sc(char* program){
    printf(concat("{\"sc\":\"",concat(program,"\"}\n")));
}

int main() {
    for(int i = 0;i<10;i++){
        sc("say Hello, World!");
 
        char result[50];
        sprintf(result, "%f", i);
        sc(concat("say ",i));
    }
   return 0;
}