using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.db.Models
{
    [Table("timetable")]
    public class Timetable
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int Id { get; set; }

        [Column(TypeName = "DATETIME")]
        public DateTime Slot { get; set; }

        [ForeignKey("Id")]
        public Staff Staff { get; set; } = null!;
    }
}